# 07 — Supabase schema, RLS and functions

Project region: **`eu-central-1` (Frankfurt)**. Postgres 16. Migrations are forward-only, timestamped, in `supabase/migrations/`.

---

## 1. Extensions & settings

```sql
create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";
create extension if not exists "btree_gist";
create extension if not exists "pg_stat_statements";
alter database postgres set timezone to 'UTC';
```

## 2. Helper functions (schema `app`)

```sql
create schema if not exists app;

-- households the current user belongs to
create or replace function app.my_household_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select household_id from household_members where user_id = auth.uid();
$$;

create or replace function app.is_member(h uuid)
returns boolean language sql stable
as $$ select h in (select app.my_household_ids()); $$;

-- the standard read predicate for tenant tables with scope
create or replace function app.can_read(h uuid, s scope_kind, owner uuid)
returns boolean language sql stable
as $$ select app.is_member(h) and (s <> 'personal' or owner = auth.uid()); $$;

-- Europe/Amsterdam business date from a timestamptz
create or replace function app.nl_date(ts timestamptz)
returns date language sql immutable
as $$ select (ts at time zone 'Europe/Amsterdam')::date; $$;
```

## 3. Table DDL (abridged — full column lists in `docs/06`)

```sql
create table profiles (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text,
  locale text not null default 'nl-NL',
  created_at timestamptz not null default now()
);

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mijn huishouden',
  period_kind period_kind not null default 'calendar_month',
  period_anchor_day smallint check (period_anchor_day between 1 and 28),
  period_anchor_date date,
  composition text,                    -- 'single','couple','couple_kids','single_kids'
  adults smallint not null default 1,
  children smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint anchor_required check (
    (period_kind = 'calendar_month')
    or (period_kind = 'custom_month' and period_anchor_day is not null)
    or (period_kind = 'four_weeks'   and period_anchor_date is not null)
  )
);

create table household_members (
  household_id uuid references households on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  income_share_bps int not null default 10000,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  owner_user_id uuid not null references auth.users,
  scope scope_kind not null default 'household',
  account_id uuid references bank_accounts on delete set null,
  external_id text,
  dedupe_hash text not null,
  booked_at date not null,
  value_at date,
  direction txn_direction not null,
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'EUR',
  original_amount_cents bigint,
  original_currency text,
  description_raw text not null default '',
  description_clean text not null default '',
  counterparty_name text,
  counterparty_iban_hash text,
  merchant_id uuid references merchants on delete set null,
  category_id uuid references categories on delete set null,
  category_source text not null default 'unset',
  category_confidence numeric(3,2) not null default 0,
  series_id uuid references recurring_series on delete set null,
  status txn_status not null default 'booked',
  source txn_source not null default 'bank',
  is_transfer boolean not null default false,
  transfer_pair_id uuid,
  is_excluded boolean not null default false,
  is_reimbursable boolean not null default false,
  note text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index txn_external_uniq on transactions (account_id, external_id) where external_id is not null;
create unique index txn_dedupe_uniq   on transactions (account_id, dedupe_hash) where external_id is null;
create index txn_household_date on transactions (household_id, booked_at desc);
create index txn_category on transactions (household_id, category_id, booked_at desc);
create index txn_search on transactions using gin (to_tsvector('dutch', coalesce(description_clean,'') || ' ' || coalesce(counterparty_name,'')));

create table budget_periods (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  kind period_kind not null,
  starts_on date not null,
  ends_on date not null,
  label text not null,
  check (ends_on > starts_on),
  exclude using gist (
    household_id with =,
    daterange(starts_on, ends_on, '[]') with &&
  )
);
```

> The `exclude` constraint enforces invariant **I-10** (no overlapping periods) at the database level.

```sql
create table budget_lines (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  period_id uuid not null references budget_periods on delete cascade,
  category_id uuid not null references categories,
  scope scope_kind not null default 'household',
  planned_cents bigint not null default 0 check (planned_cents >= 0),
  rollover_mode rollover_mode not null default 'none',
  carried_in_cents bigint not null default 0,
  note text,
  unique (period_id, category_id, scope)
);

create table envelopes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  owner_user_id uuid not null references auth.users,
  scope scope_kind not null default 'household',
  kind envelope_kind not null default 'reservering',
  name text not null,
  category_id uuid references categories on delete set null,
  target_cents bigint not null check (target_cents >= 0),
  target_date date,
  saved_cents bigint not null default 0,
  monthly_contribution_cents bigint,
  auto_contribute boolean not null default true,
  linked_account_id uuid references bank_accounts on delete set null,
  priority int not null default 100,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
```

## 4. Row Level Security

Enable RLS on **every** table in `public`. Template, applied per tenant table:

```sql
alter table transactions enable row level security;

create policy txn_select on transactions for select
  using (app.can_read(household_id, scope, owner_user_id));

create policy txn_insert on transactions for insert
  with check (app.is_member(household_id) and owner_user_id = auth.uid());

create policy txn_update on transactions for update
  using (app.can_read(household_id, scope, owner_user_id))
  with check (app.is_member(household_id));

create policy txn_delete on transactions for delete
  using (app.can_read(household_id, scope, owner_user_id));
```

Additional rules:
- `categories`: select allowed when `household_id is null` (system) **or** `app.is_member(household_id)`. Insert/update/delete only for own household rows.
- `household_members`: a member may read the member list of their households; only `owner` may insert/delete.
- `bank_connections` / `bank_accounts`: select requires membership; `personal`-scoped accounts only for the owner.
- `nibud_reference`: readable by all authenticated users; writable only by service role.
- **No table is readable by the `anon` role.**

**Forbidden**: `security definer` functions that bypass RLS and return tenant data without re-checking membership. Every definer function must call `app.is_member()` explicitly.

## 5. Triggers

```sql
-- updated_at
create or replace function app.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- immutability of household_id (invariant I-1)
create or replace function app.freeze_household() returns trigger
language plpgsql as $$
begin
  if new.household_id is distinct from old.household_id then
    raise exception 'household_id is immutable';
  end if;
  return new;
end $$;

-- envelope saved_cents (invariant I-11)
create or replace function app.recalc_envelope_saved() returns trigger
language plpgsql as $$
begin
  update envelopes e set saved_cents = coalesce((
    select sum(case when c.kind = 'withdrawal' then -c.amount_cents else c.amount_cents end)
    from envelope_contributions c
    where c.envelope_id = e.id and c.kind in ('actual','withdrawal')
  ), 0)
  where e.id = coalesce(new.envelope_id, old.envelope_id);
  return null;
end $$;

-- protect user categorisation (invariant I-6)
create or replace function app.protect_user_category() returns trigger
language plpgsql as $$
begin
  if old.category_source = 'user' and new.category_source <> 'user'
     and new.category_id is distinct from old.category_id then
    new.category_id := old.category_id;
    new.category_source := 'user';
  end if;
  return new;
end $$;
```

## 6. Views & RPC

```sql
-- spend per category per period, respecting splits, transfers and exclusions
create view v_period_actuals as
with base as (
  select t.household_id, t.id, t.booked_at, t.direction, t.scope,
         coalesce(s.category_id, t.category_id) as category_id,
         coalesce(s.amount_cents, t.amount_cents) as amount_cents
  from transactions t
  left join transaction_splits s on s.transaction_id = t.id
  where not t.is_transfer and not t.is_excluded
)
select p.id as period_id, b.household_id, b.category_id, b.scope,
       sum(b.amount_cents) filter (where b.direction = 'out') as out_cents,
       sum(b.amount_cents) filter (where b.direction = 'in')  as in_cents
from budget_periods p
join base b on b.household_id = p.household_id
           and b.booked_at between p.starts_on and p.ends_on
group by 1,2,3,4;
```

RPCs (all `security invoker`, so RLS applies):

| Function | Signature | Purpose |
|---|---|---|
| `rpc_current_period(h uuid)` | → `budget_periods` | The period containing today for the household's period kind; creates it if missing |
| `rpc_safe_to_spend(h uuid, as_of date)` | → `jsonb` | The headline number + its components (`docs/10` §5) |
| `rpc_roll_period(h uuid, from_period uuid)` | → `uuid` | Creates the next period, applies rollover, freezes `carried_in_cents` |
| `rpc_forecast(h uuid, days int)` | → `setof (day date, balance_cents bigint, low bool)` | Daily cashflow projection (`docs/10` §6) |
| `rpc_recategorise(txn uuid, cat uuid, learn bool)` | → `void` | Sets category as `user`, optionally creates a learned rule |
| `rpc_merge_transactions(keep uuid, drop uuid)` | → `void` | Dedupe merge preserving user fields (I-8) |
| `rpc_export_household(h uuid)` | → `jsonb` | Full AVG art. 20 export |
| `rpc_delete_account()` | → `void` | Hard delete, cascades, writes to `audit_log` before removal |

## 7. Scheduled jobs (pg_cron, all times UTC)

| Cron | Job | Notes |
|---|---|---|
| `0 4 * * *` | `sync_all_connections()` | Nightly bank refresh; jittered per household |
| `0 5 * * *` | `detect_recurring()` | Re-run series detection on new data |
| `15 5 * * *` | `refresh_forecasts()` | Materialise 90-day forecast per household |
| `30 5 * * *` | `queue_notifications()` | Build the day's notification set (`docs/17`) |
| `0 6 1 * *` | `roll_periods()` | For `calendar_month` households |
| `0 6 * * *` | `roll_periods_custom()` | For `custom_month` / `four_weeks` households due today |
| `0 3 * * 0` | `vacuum_analyze_hot_tables()` | |
| `0 2 1 1 *` | `annual_reset()` | Reset eigen risico, snapshot box 3 peildatum |

Each job must be idempotent and safe to run twice.

## 8. Storage

Bucket `attachments`, private. Path convention: `{household_id}/{transaction_id}/{uuid}.{ext}`.
Policy: read/write only when `app.is_member(household_id)` derived from the first path segment.

## 9. Migration rules

- One concern per migration, named `YYYYMMDDHHMMSS_short_description.sql`.
- Every migration adding a tenant table **must** in the same file: enable RLS, add all four policies, add indexes, and add a matching pgTAP test in `supabase/tests/`.
- Never `drop column` in the same release that stops writing it — deprecate for one release first.
- Seeds are separate and idempotent (`insert … on conflict do nothing`).
