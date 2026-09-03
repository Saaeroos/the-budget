-- Kwartje — 08: recurring_series, series_occurrences, obligations,
-- obligation_instalments, income_events, benefits.
-- Spec: docs/06-data-model.md §8; docs/07-supabase-schema.md §4.
--
-- docs/06 §8 gives no owner_user_id column for recurring_series/obligations,
-- yet both carry a `scope` that can be 'personal' — meaningless without an
-- owner to test app.can_read against. Added for consistency with every
-- other scoped table (bank_accounts, transactions, envelopes, budget_lines,
-- rules) and because the pgTAP suite must prove a personal-scoped row is
-- invisible to another household member for every tenant table. See
-- docs/DECISIONS.md.

create table recurring_series (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  owner_user_id uuid references auth.users,
  scope scope_kind not null default 'household',
  -- merchants is created later (09_supporting); FK added there.
  merchant_id uuid,
  counterparty_iban_hash text,
  name text not null,
  category_id uuid references categories,
  cadence cadence not null,
  typical_amount_cents bigint not null check (typical_amount_cents > 0),
  amount_tolerance_bps int not null default 500,
  next_expected_on date,
  last_seen_on date,
  confidence numeric(3, 2) not null default 0 check (confidence >= 0 and confidence <= 1),
  is_subscription boolean not null default false,
  contract_started_on date,
  cancellable_from date,
  cancel_url text,
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  created_from text not null default 'manual' check (created_from in ('detected', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_series_personal_owner_ck check (scope <> 'personal' or owner_user_id is not null)
);

create index recurring_series_household_idx on recurring_series (household_id);
create index recurring_series_next_expected_idx on recurring_series (household_id, next_expected_on);

revoke all on table recurring_series from anon;
alter table recurring_series enable row level security;

create policy recurring_series_select on recurring_series for select to authenticated
  using (app.can_read(household_id, scope, owner_user_id));
create policy recurring_series_insert on recurring_series for insert to authenticated
  with check (
    app.is_member(household_id)
    and (scope <> 'personal' or owner_user_id = auth.uid())
  );
create policy recurring_series_update on recurring_series for update to authenticated
  using (app.can_read(household_id, scope, owner_user_id))
  with check (app.is_member(household_id));
create policy recurring_series_delete on recurring_series for delete to authenticated
  using (app.can_read(household_id, scope, owner_user_id));

create trigger recurring_series_touch_updated_at before update on recurring_series
  for each row execute function app.touch_updated_at();
create trigger recurring_series_freeze_household before update on recurring_series
  for each row execute function app.freeze_household();

-- transactions.series_id → recurring_series, deferred from 05_transactions
-- because recurring_series did not exist yet at that point in the migration
-- order.
alter table transactions
  add constraint transactions_series_fk foreign key (series_id) references recurring_series (id) on delete set null;

-- ── series_occurrences ───────────────────────────────────────────────────
-- docs/06 §8 lists no household_id/scope; tenancy derived via series_id.
create table series_occurrences (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references recurring_series on delete cascade,
  expected_on date not null,
  expected_amount_cents bigint not null check (expected_amount_cents > 0),
  transaction_id uuid references transactions on delete set null,
  status text not null default 'expected' check (status in ('expected', 'matched', 'missed', 'skipped'))
);

create index series_occurrences_series_idx on series_occurrences (series_id, expected_on desc);

revoke all on table series_occurrences from anon;
alter table series_occurrences enable row level security;

create policy series_occurrences_select on series_occurrences for select to authenticated
  using (exists (
    select 1 from recurring_series s
    where s.id = series_occurrences.series_id and app.can_read(s.household_id, s.scope, s.owner_user_id)
  ));
create policy series_occurrences_insert on series_occurrences for insert to authenticated
  with check (exists (
    select 1 from recurring_series s where s.id = series_occurrences.series_id and app.is_member(s.household_id)
  ));
create policy series_occurrences_update on series_occurrences for update to authenticated
  using (exists (
    select 1 from recurring_series s
    where s.id = series_occurrences.series_id and app.can_read(s.household_id, s.scope, s.owner_user_id)
  ))
  with check (exists (
    select 1 from recurring_series s where s.id = series_occurrences.series_id and app.is_member(s.household_id)
  ));
create policy series_occurrences_delete on series_occurrences for delete to authenticated
  using (exists (
    select 1 from recurring_series s
    where s.id = series_occurrences.series_id and app.can_read(s.household_id, s.scope, s.owner_user_id)
  ));

-- ── obligations ──────────────────────────────────────────────────────────
create table obligations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  owner_user_id uuid references auth.users,
  scope scope_kind not null default 'household',
  -- Informal reference to obligation_templates.key (seeded in 09_supporting,
  -- table created there). Left as plain text rather than a hard FK: the
  -- template is a seed-data hint for pre-filling a new obligation, not a
  -- relationship that must survive the template being retired.
  template_key text,
  name text not null,
  category_id uuid not null references categories,
  expected_amount_cents bigint not null check (expected_amount_cents > 0),
  expected_on date not null,
  certainty text not null default 'estimated' check (certainty in ('estimated', 'confirmed')),
  envelope_id uuid references envelopes on delete set null,
  instalment_count int check (instalment_count > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint obligations_personal_owner_ck check (scope <> 'personal' or owner_user_id is not null)
);

create index obligations_household_idx on obligations (household_id, expected_on);

revoke all on table obligations from anon;
alter table obligations enable row level security;

create policy obligations_select on obligations for select to authenticated
  using (app.can_read(household_id, scope, owner_user_id));
create policy obligations_insert on obligations for insert to authenticated
  with check (
    app.is_member(household_id)
    and (scope <> 'personal' or owner_user_id = auth.uid())
  );
create policy obligations_update on obligations for update to authenticated
  using (app.can_read(household_id, scope, owner_user_id))
  with check (app.is_member(household_id));
create policy obligations_delete on obligations for delete to authenticated
  using (app.can_read(household_id, scope, owner_user_id));

create trigger obligations_touch_updated_at before update on obligations
  for each row execute function app.touch_updated_at();
create trigger obligations_freeze_household before update on obligations
  for each row execute function app.freeze_household();

-- ── obligation_instalments ───────────────────────────────────────────────
create table obligation_instalments (
  id uuid primary key default gen_random_uuid(),
  obligation_id uuid not null references obligations on delete cascade,
  due_on date not null,
  amount_cents bigint not null check (amount_cents > 0),
  transaction_id uuid references transactions on delete set null,
  status text not null default 'due' check (status in ('due', 'paid', 'skipped', 'overdue'))
);

create index obligation_instalments_obligation_idx on obligation_instalments (obligation_id, due_on);

revoke all on table obligation_instalments from anon;
alter table obligation_instalments enable row level security;

create policy obligation_instalments_select on obligation_instalments for select to authenticated
  using (exists (
    select 1 from obligations o
    where o.id = obligation_instalments.obligation_id and app.can_read(o.household_id, o.scope, o.owner_user_id)
  ));
create policy obligation_instalments_insert on obligation_instalments for insert to authenticated
  with check (exists (
    select 1 from obligations o where o.id = obligation_instalments.obligation_id and app.is_member(o.household_id)
  ));
create policy obligation_instalments_update on obligation_instalments for update to authenticated
  using (exists (
    select 1 from obligations o
    where o.id = obligation_instalments.obligation_id and app.can_read(o.household_id, o.scope, o.owner_user_id)
  ))
  with check (exists (
    select 1 from obligations o where o.id = obligation_instalments.obligation_id and app.is_member(o.household_id)
  ));
create policy obligation_instalments_delete on obligation_instalments for delete to authenticated
  using (exists (
    select 1 from obligations o
    where o.id = obligation_instalments.obligation_id and app.can_read(o.household_id, o.scope, o.owner_user_id)
  ));

-- ── income_events ────────────────────────────────────────────────────────
create table income_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  owner_user_id uuid not null references auth.users,
  scope scope_kind not null default 'household',
  kind text not null check (kind in ('salary', 'vakantiegeld', 'dertiende_maand', 'benefit', 'other')),
  name text not null,
  expected_on date not null,
  expected_amount_cents bigint not null check (expected_amount_cents > 0),
  cadence cadence not null,
  actual_transaction_id uuid references transactions on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index income_events_household_idx on income_events (household_id, expected_on);

revoke all on table income_events from anon;
alter table income_events enable row level security;

create policy income_events_select on income_events for select to authenticated
  using (app.can_read(household_id, scope, owner_user_id));
create policy income_events_insert on income_events for insert to authenticated
  with check (app.is_member(household_id) and owner_user_id = auth.uid());
create policy income_events_update on income_events for update to authenticated
  using (app.can_read(household_id, scope, owner_user_id))
  with check (app.is_member(household_id));
create policy income_events_delete on income_events for delete to authenticated
  using (app.can_read(household_id, scope, owner_user_id));

create trigger income_events_touch_updated_at before update on income_events
  for each row execute function app.touch_updated_at();
create trigger income_events_freeze_household before update on income_events
  for each row execute function app.freeze_household();

-- ── benefits (toeslagen) ─────────────────────────────────────────────────
-- docs/06 §8 gives no `scope` column for benefits — a toeslag is inherently
-- tied to the recipient, so visibility is is_member + owner-manages-own
-- rather than app.can_read (which needs a scope_kind).
create table benefits (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  owner_user_id uuid not null references auth.users,
  type text not null check (type in ('zorgtoeslag', 'huurtoeslag', 'kindgebonden_budget', 'kinderopvangtoeslag')),
  monthly_amount_cents bigint not null check (monthly_amount_cents >= 0),
  valid_from date not null,
  valid_to date,
  reference_income_cents bigint,
  last_confirmed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_to >= valid_from)
);

create index benefits_household_idx on benefits (household_id);

revoke all on table benefits from anon;
alter table benefits enable row level security;

create policy benefits_select on benefits for select to authenticated
  using (app.is_member(household_id));
create policy benefits_insert on benefits for insert to authenticated
  with check (app.is_member(household_id) and owner_user_id = auth.uid());
create policy benefits_update on benefits for update to authenticated
  using (app.is_member(household_id) and owner_user_id = auth.uid())
  with check (app.is_member(household_id) and owner_user_id = auth.uid());
create policy benefits_delete on benefits for delete to authenticated
  using (app.is_member(household_id) and owner_user_id = auth.uid());

create trigger benefits_touch_updated_at before update on benefits
  for each row execute function app.touch_updated_at();
create trigger benefits_freeze_household before update on benefits
  for each row execute function app.freeze_household();
