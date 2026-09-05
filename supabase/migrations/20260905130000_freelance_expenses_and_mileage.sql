-- Kwartje — 12: business_trips, business_assets, expense_claims, transaction deductions.
-- Spec: freelance cost declaration, mileage allowance (€0.23/km), asset depreciation (> €450), mixed expenses.

-- ── 1. business_trips ────────────────────────────────────────────────────
-- Kilometer registration for business trips (private car deduction or company car tracking).
create table business_trips (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  owner_user_id uuid not null references auth.users,
  scope scope_kind not null default 'business',
  trip_date date not null,
  departure_location text not null,
  destination_location text not null,
  distance_km numeric(8, 2) not null check (distance_km > 0),
  is_round_trip boolean not null default false,
  rate_cents_per_km smallint not null default 23,
  purpose text not null,
  counterparty_name text,
  vehicle_type text not null default 'private' check (vehicle_type in ('private', 'business')),
  reimbursed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index business_trips_household_idx on business_trips (household_id, trip_date desc);

revoke all on table business_trips from anon;
alter table business_trips enable row level security;

create policy business_trips_select on business_trips for select to authenticated
  using (app.can_read(household_id, scope, owner_user_id));
create policy business_trips_insert on business_trips for insert to authenticated
  with check (app.is_member(household_id) and owner_user_id = auth.uid());
create policy business_trips_update on business_trips for update to authenticated
  using (app.can_read(household_id, scope, owner_user_id))
  with check (app.is_member(household_id));
create policy business_trips_delete on business_trips for delete to authenticated
  using (app.can_read(household_id, scope, owner_user_id));

create trigger business_trips_touch_updated_at before update on business_trips
  for each row execute function app.touch_updated_at();
create trigger business_trips_freeze_household before update on business_trips
  for each row execute function app.freeze_household();

-- ── 2. business_assets ───────────────────────────────────────────────────
-- Long-term capital assets (> €450 excl. BTW) subject to multi-year depreciation and KIA.
create table business_assets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  owner_user_id uuid not null references auth.users,
  scope scope_kind not null default 'business',
  transaction_id uuid references transactions on delete set null,
  name text not null,
  category text not null check (category in ('hardware', 'phone', 'furniture', 'tools', 'vehicle', 'other')),
  purchase_date date not null,
  purchase_cost_cents bigint not null check (purchase_cost_cents > 0),
  residual_value_cents bigint not null default 0 check (residual_value_cents >= 0),
  lifespan_months smallint not null default 60 check (lifespan_months between 1 and 360),
  btw_rate smallint not null default 21 check (btw_rate in (0, 9, 21)),
  btw_amount_cents bigint not null default 0,
  is_kia_eligible boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index business_assets_household_idx on business_assets (household_id, purchase_date desc);

revoke all on table business_assets from anon;
alter table business_assets enable row level security;

create policy business_assets_select on business_assets for select to authenticated
  using (app.can_read(household_id, scope, owner_user_id));
create policy business_assets_insert on business_assets for insert to authenticated
  with check (app.is_member(household_id) and owner_user_id = auth.uid());
create policy business_assets_update on business_assets for update to authenticated
  using (app.can_read(household_id, scope, owner_user_id))
  with check (app.is_member(household_id));
create policy business_assets_delete on business_assets for delete to authenticated
  using (app.can_read(household_id, scope, owner_user_id));

create trigger business_assets_touch_updated_at before update on business_assets
  for each row execute function app.touch_updated_at();
create trigger business_assets_freeze_household before update on business_assets
  for each row execute function app.freeze_household();

-- ── 3. expense_claims ────────────────────────────────────────────────────
-- Out-of-pocket expenses paid from private funds or manual receipt declarations (privé-inbreng).
create table expense_claims (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  owner_user_id uuid not null references auth.users,
  scope scope_kind not null default 'business',
  expense_date date not null,
  merchant_name text not null,
  amount_cents bigint not null check (amount_cents > 0),
  btw_rate smallint not null default 21 check (btw_rate in (0, 9, 21)),
  btw_amount_cents bigint not null default 0,
  deduction_rate_bps smallint not null default 10000 check (deduction_rate_bps between 0 and 10000),
  category_kind text not null default 'standard' check (category_kind in ('standard', 'horeca', 'telecom', 'workspace')),
  is_private_advance boolean not null default true,
  reimbursed_at timestamptz,
  receipt_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expense_claims_household_idx on expense_claims (household_id, expense_date desc);

revoke all on table expense_claims from anon;
alter table expense_claims enable row level security;

create policy expense_claims_select on expense_claims for select to authenticated
  using (app.can_read(household_id, scope, owner_user_id));
create policy expense_claims_insert on expense_claims for insert to authenticated
  with check (app.is_member(household_id) and owner_user_id = auth.uid());
create policy expense_claims_update on expense_claims for update to authenticated
  using (app.can_read(household_id, scope, owner_user_id))
  with check (app.is_member(household_id));
create policy expense_claims_delete on expense_claims for delete to authenticated
  using (app.can_read(household_id, scope, owner_user_id));

create trigger expense_claims_touch_updated_at before update on expense_claims
  for each row execute function app.touch_updated_at();
create trigger expense_claims_freeze_household before update on expense_claims
  for each row execute function app.freeze_household();

-- ── 4. Extend transactions table ──────────────────────────────────────────
-- Add deduction rate (for 80% horeca or mixed expenses) and private advance indicator
alter table transactions add column if not exists deduction_rate_bps smallint check (deduction_rate_bps between 0 and 10000);
alter table transactions add column if not exists is_private_advance boolean not null default false;
