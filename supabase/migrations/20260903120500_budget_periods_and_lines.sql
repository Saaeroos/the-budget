-- Kwartje — 06: budget_periods, budget_lines.
-- Spec: docs/06-data-model.md §7; docs/07-supabase-schema.md §3, §4.

create table budget_periods (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  kind period_kind not null,
  starts_on date not null,
  ends_on date not null,
  label text not null,
  -- docs/06 §7 lists is_current but the abridged DDL in docs/07 omits it;
  -- required to make rpc_current_period a cheap lookup instead of a
  -- recompute, and to know which period to roll from.
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on > starts_on),
  -- invariant I-10: periods for a household never overlap.
  exclude using gist (
    household_id with =,
    daterange(starts_on, ends_on, '[]') with &&
  )
);

create index budget_periods_household_idx on budget_periods (household_id, starts_on desc);
-- at most one current period per household.
create unique index budget_periods_one_current on budget_periods (household_id) where is_current;

revoke all on table budget_periods from anon;
alter table budget_periods enable row level security;

create policy budget_periods_select on budget_periods for select to authenticated
  using (app.is_member(household_id));
create policy budget_periods_insert on budget_periods for insert to authenticated
  with check (app.is_member(household_id));
create policy budget_periods_update on budget_periods for update to authenticated
  using (app.is_member(household_id)) with check (app.is_member(household_id));
create policy budget_periods_delete on budget_periods for delete to authenticated
  using (app.is_member(household_id));

create trigger budget_periods_touch_updated_at before update on budget_periods
  for each row execute function app.touch_updated_at();
create trigger budget_periods_freeze_household before update on budget_periods
  for each row execute function app.freeze_household();

-- ── budget_lines ─────────────────────────────────────────────────────────
create table budget_lines (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  period_id uuid not null references budget_periods on delete cascade,
  category_id uuid not null references categories,
  -- docs/06 §7 does not list an owner column, but a scope of 'personal'
  -- is meaningless without one to test app.can_read against — every other
  -- scoped table carries an owner. Added for consistency; see DECISIONS.md.
  owner_user_id uuid references auth.users,
  scope scope_kind not null default 'household',
  planned_cents bigint not null default 0 check (planned_cents >= 0),
  rollover_mode rollover_mode not null default 'none',
  carried_in_cents bigint not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period_id, category_id, scope),
  constraint budget_lines_personal_owner_ck check (scope <> 'personal' or owner_user_id is not null)
);

create index budget_lines_period_idx on budget_lines (period_id);
create index budget_lines_household_idx on budget_lines (household_id);

revoke all on table budget_lines from anon;
alter table budget_lines enable row level security;

create policy budget_lines_select on budget_lines for select to authenticated
  using (app.can_read(household_id, scope, owner_user_id));
create policy budget_lines_insert on budget_lines for insert to authenticated
  with check (
    app.is_member(household_id)
    and (scope <> 'personal' or owner_user_id = auth.uid())
  );
create policy budget_lines_update on budget_lines for update to authenticated
  using (app.can_read(household_id, scope, owner_user_id))
  with check (app.is_member(household_id));
create policy budget_lines_delete on budget_lines for delete to authenticated
  using (app.can_read(household_id, scope, owner_user_id));

create trigger budget_lines_touch_updated_at before update on budget_lines
  for each row execute function app.touch_updated_at();
create trigger budget_lines_freeze_household before update on budget_lines
  for each row execute function app.freeze_household();
