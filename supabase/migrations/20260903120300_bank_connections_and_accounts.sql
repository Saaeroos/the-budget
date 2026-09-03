-- Kwartje — 04: bank_connections, bank_auth_nonces, bank_accounts, balances.
-- Spec: docs/06-data-model.md §4; docs/07-supabase-schema.md §4;
--       docs/08-bank-sync-psd2.md (state JWT + nonce), docs/16 §3 (IBAN hashing).
--
-- Invariant I-2: no tokens or credentials are stored anywhere in this file.
-- Invariant I-3: the full IBAN is never stored; only iban_hash + iban_last4.

create table bank_connections (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  owner_user_id uuid not null references auth.users,
  provider text not null default 'enable_banking' check (provider in ('enable_banking')),
  institution_id text not null,
  institution_name text not null,
  session_id text,
  state connection_state not null default 'active',
  consented_at timestamptz,
  expires_at timestamptz,
  last_sync_at timestamptz,
  last_error_code text,
  psu_ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bank_connections_household_idx on bank_connections (household_id);

revoke all on table bank_connections from anon;
alter table bank_connections enable row level security;

-- docs/07 §4: "select requires membership" (no personal-scope narrowing —
-- bank_connections itself carries no scope column). Only the authorising
-- member manages it further.
create policy bank_connections_select on bank_connections for select to authenticated
  using (app.is_member(household_id));
create policy bank_connections_insert on bank_connections for insert to authenticated
  with check (app.is_member(household_id) and owner_user_id = auth.uid());
create policy bank_connections_update on bank_connections for update to authenticated
  using (app.is_member(household_id) and owner_user_id = auth.uid())
  with check (app.is_member(household_id) and owner_user_id = auth.uid());
create policy bank_connections_delete on bank_connections for delete to authenticated
  using (app.is_member(household_id) and owner_user_id = auth.uid());

create trigger bank_connections_touch_updated_at before update on bank_connections
  for each row execute function app.touch_updated_at();
create trigger bank_connections_freeze_household before update on bank_connections
  for each row execute function app.freeze_household();

-- ── bank_auth_nonces ─────────────────────────────────────────────────────
-- docs/08 §"state is a JWT ... nonce stored in bank_auth_nonces, deleted on
-- use". Pure anti-replay bookkeeping for the Edge Function OAuth-style
-- redirect flow: never read or written by client queries, only by Edge
-- Functions holding the service_role key, which bypasses RLS entirely. RLS
-- is still enabled with no grants to authenticated/anon, so this table is
-- unreadable from the client under any circumstance.
create table bank_auth_nonces (
  nonce text primary key,
  household_id uuid not null references households on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  connection_id uuid references bank_connections on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index bank_auth_nonces_expires_idx on bank_auth_nonces (expires_at);

revoke all on table bank_auth_nonces from anon, authenticated;
alter table bank_auth_nonces enable row level security;

-- No policies at all: with RLS enabled and no policy for a given command,
-- every role except the table owner and roles with BYPASSRLS (service_role)
-- is denied outright — deliberately, since this table has no legitimate
-- client-facing use.

-- ── bank_accounts ────────────────────────────────────────────────────────
create table bank_accounts (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references bank_connections on delete cascade,
  household_id uuid not null references households on delete cascade,
  owner_user_id uuid not null references auth.users,
  scope scope_kind not null default 'household',
  iban_hash text not null,
  iban_last4 text not null check (char_length(iban_last4) = 4),
  display_name text not null,
  official_name text,
  account_type text not null check (account_type in ('payment', 'savings', 'card', 'joint')),
  currency text not null default 'EUR',
  include_in_budget boolean not null default true,
  history_available_from date,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, iban_hash)
);

create index bank_accounts_household_idx on bank_accounts (household_id);
create index bank_accounts_connection_idx on bank_accounts (connection_id);

revoke all on table bank_accounts from anon;
alter table bank_accounts enable row level security;

-- docs/07 §4: "personal-scoped accounts only for the owner" → app.can_read.
create policy bank_accounts_select on bank_accounts for select to authenticated
  using (app.can_read(household_id, scope, owner_user_id));
create policy bank_accounts_insert on bank_accounts for insert to authenticated
  with check (app.is_member(household_id) and owner_user_id = auth.uid());
create policy bank_accounts_update on bank_accounts for update to authenticated
  using (app.can_read(household_id, scope, owner_user_id))
  with check (app.is_member(household_id));
create policy bank_accounts_delete on bank_accounts for delete to authenticated
  using (app.can_read(household_id, scope, owner_user_id));

create trigger bank_accounts_touch_updated_at before update on bank_accounts
  for each row execute function app.touch_updated_at();
create trigger bank_accounts_freeze_household before update on bank_accounts
  for each row execute function app.freeze_household();

-- ── balances ─────────────────────────────────────────────────────────────
-- docs/06 §4 lists no household_id/scope on this table, so its tenancy is
-- derived through account_id → bank_accounts rather than duplicated here.
create table balances (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references bank_accounts on delete cascade,
  as_of date not null,
  kind text not null check (kind in ('booked', 'available')),
  amount_cents bigint not null,
  created_at timestamptz not null default now(),
  unique (account_id, as_of, kind)
);

create index balances_account_idx on balances (account_id, as_of desc);

revoke all on table balances from anon;
alter table balances enable row level security;

create policy balances_select on balances for select to authenticated
  using (exists (
    select 1 from bank_accounts a
    where a.id = balances.account_id and app.can_read(a.household_id, a.scope, a.owner_user_id)
  ));
create policy balances_insert on balances for insert to authenticated
  with check (exists (
    select 1 from bank_accounts a
    where a.id = balances.account_id and app.is_member(a.household_id)
  ));
create policy balances_update on balances for update to authenticated
  using (exists (
    select 1 from bank_accounts a
    where a.id = balances.account_id and app.can_read(a.household_id, a.scope, a.owner_user_id)
  ))
  with check (exists (
    select 1 from bank_accounts a
    where a.id = balances.account_id and app.is_member(a.household_id)
  ));
create policy balances_delete on balances for delete to authenticated
  using (exists (
    select 1 from bank_accounts a
    where a.id = balances.account_id and app.can_read(a.household_id, a.scope, a.owner_user_id)
  ));
