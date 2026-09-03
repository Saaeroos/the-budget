-- Kwartje — 07: envelopes (potjes), envelope_contributions.
-- Spec: docs/06-data-model.md §7; docs/07-supabase-schema.md §3, §4, §5.
-- docs/10-budget-engine.md §4 ("goals" are envelopes with kind='goal' — no
-- separate table, per docs/06 §9).

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
  -- invariant I-11: materialised by app.recalc_envelope_saved(), never
  -- written to directly by client code.
  saved_cents bigint not null default 0,
  monthly_contribution_cents bigint,
  auto_contribute boolean not null default true,
  linked_account_id uuid references bank_accounts on delete set null,
  priority int not null default 100,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index envelopes_household_idx on envelopes (household_id);
create index envelopes_category_idx on envelopes (category_id) where category_id is not null;

revoke all on table envelopes from anon;
alter table envelopes enable row level security;

create policy envelopes_select on envelopes for select to authenticated
  using (app.can_read(household_id, scope, owner_user_id));
create policy envelopes_insert on envelopes for insert to authenticated
  with check (app.is_member(household_id) and owner_user_id = auth.uid());
create policy envelopes_update on envelopes for update to authenticated
  using (app.can_read(household_id, scope, owner_user_id))
  with check (app.is_member(household_id));
create policy envelopes_delete on envelopes for delete to authenticated
  using (app.can_read(household_id, scope, owner_user_id));

create trigger envelopes_touch_updated_at before update on envelopes
  for each row execute function app.touch_updated_at();
create trigger envelopes_freeze_household before update on envelopes
  for each row execute function app.freeze_household();

-- ── envelope_contributions ───────────────────────────────────────────────
-- docs/06 §7 lists no household_id/scope here; tenancy is derived via
-- envelope_id → envelopes.
create table envelope_contributions (
  id uuid primary key default gen_random_uuid(),
  envelope_id uuid not null references envelopes on delete cascade,
  period_id uuid references budget_periods on delete set null,
  amount_cents bigint not null check (amount_cents > 0),
  kind text not null check (kind in ('planned', 'actual', 'withdrawal')),
  transaction_id uuid references transactions on delete set null,
  created_at timestamptz not null default now()
);

create index envelope_contributions_envelope_idx on envelope_contributions (envelope_id);

revoke all on table envelope_contributions from anon;
alter table envelope_contributions enable row level security;

create policy envelope_contributions_select on envelope_contributions for select to authenticated
  using (exists (
    select 1 from envelopes e
    where e.id = envelope_contributions.envelope_id and app.can_read(e.household_id, e.scope, e.owner_user_id)
  ));
create policy envelope_contributions_insert on envelope_contributions for insert to authenticated
  with check (exists (
    select 1 from envelopes e
    where e.id = envelope_contributions.envelope_id and app.is_member(e.household_id)
  ));
create policy envelope_contributions_update on envelope_contributions for update to authenticated
  using (exists (
    select 1 from envelopes e
    where e.id = envelope_contributions.envelope_id and app.can_read(e.household_id, e.scope, e.owner_user_id)
  ))
  with check (exists (
    select 1 from envelopes e
    where e.id = envelope_contributions.envelope_id and app.is_member(e.household_id)
  ));
create policy envelope_contributions_delete on envelope_contributions for delete to authenticated
  using (exists (
    select 1 from envelopes e
    where e.id = envelope_contributions.envelope_id and app.can_read(e.household_id, e.scope, e.owner_user_id)
  ));

-- invariant I-11, docs/07 §5 verbatim: saved_cents is the signed sum of
-- 'actual' and 'withdrawal' contributions, refreshed by trigger.
create trigger envelope_contributions_recalc_saved
  after insert or update or delete on envelope_contributions
  for each row execute function app.recalc_envelope_saved();
