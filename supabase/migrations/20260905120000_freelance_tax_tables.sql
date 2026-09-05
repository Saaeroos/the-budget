-- Kwartje — 11: btw_filings, annual_tax_summaries, tax_parameters.
-- Spec: freelance/ZZP accountant replacement (quarterly BTW & annual IB aangifte).

-- ── 1. tax_parameters ───────────────────────────────────────────────────
-- Global reference table for year-specific Dutch fiscal parameters (like nibud_reference).
-- Readable by authenticated users; writable only by service role.
create table tax_parameters (
  year smallint primary key check (year between 2020 and 2100),
  zelfstandigenaftrek_cents bigint not null,
  startersaftrek_cents bigint not null,
  mkb_vrijstelling_bps smallint not null,
  schijf_1_upper_cents bigint not null,
  schijf_1_rate_bps smallint not null,
  schijf_2_rate_bps smallint not null,
  alg_heffingskorting_cents bigint not null,
  arbeidskorting_max_cents bigint not null,
  box3_vrijstelling_cents bigint not null,
  kor_drempel_cents bigint not null,
  source_note text
);

revoke all on table tax_parameters from anon;
alter table tax_parameters enable row level security;

create policy tax_parameters_select on tax_parameters for select to authenticated
  using (true);
create policy tax_parameters_insert on tax_parameters for insert to authenticated
  with check (false);
create policy tax_parameters_update on tax_parameters for update to authenticated
  using (false) with check (false);
create policy tax_parameters_delete on tax_parameters for delete to authenticated
  using (false);

-- Seed 2025 and 2026 statutory rates
insert into tax_parameters (
  year,
  zelfstandigenaftrek_cents,
  startersaftrek_cents,
  mkb_vrijstelling_bps,
  schijf_1_upper_cents,
  schijf_1_rate_bps,
  schijf_2_rate_bps,
  alg_heffingskorting_cents,
  arbeidskorting_max_cents,
  box3_vrijstelling_cents,
  kor_drempel_cents,
  source_note
) values
(2025, 247000, 212300, 1270, 3844100, 3697, 4950, 336200, 553200, 5700000, 2000000, 'Belastingdienst tarieven 2025'),
(2026, 503000, 212300, 1270, 3844100, 3697, 4950, 336200, 553200, 5700000, 2000000, 'Belastingdienst tarieven 2026');

-- ── 2. btw_filings ───────────────────────────────────────────────────────
-- Quarterly Dutch VAT returns (OB aangifte per kwartaal).
create table btw_filings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  owner_user_id uuid not null references auth.users,
  scope scope_kind not null default 'business',
  quarter smallint not null check (quarter between 1 and 4),
  year smallint not null check (year between 2020 and 2100),
  status text not null default 'draft' check (status in ('draft', 'ready', 'filed', 'paid')),
  rubriek_1a_cents bigint not null default 0,
  rubriek_1b_cents bigint not null default 0,
  rubriek_1e_cents bigint not null default 0,
  rubriek_1f_cents bigint not null default 0,
  rubriek_4a_cents bigint not null default 0,
  rubriek_5b_cents bigint not null default 0,
  rubriek_5g_cents bigint not null default 0,
  total_due_cents bigint not null default 0,
  filed_at timestamptz,
  paid_at timestamptz,
  reference_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, owner_user_id, quarter, year)
);

create index btw_filings_household_idx on btw_filings (household_id, year desc, quarter desc);

revoke all on table btw_filings from anon;
alter table btw_filings enable row level security;

create policy btw_filings_select on btw_filings for select to authenticated
  using (app.can_read(household_id, scope, owner_user_id));
create policy btw_filings_insert on btw_filings for insert to authenticated
  with check (app.is_member(household_id) and owner_user_id = auth.uid());
create policy btw_filings_update on btw_filings for update to authenticated
  using (app.can_read(household_id, scope, owner_user_id))
  with check (app.is_member(household_id));
create policy btw_filings_delete on btw_filings for delete to authenticated
  using (app.can_read(household_id, scope, owner_user_id));

create trigger btw_filings_touch_updated_at before update on btw_filings
  for each row execute function app.touch_updated_at();
create trigger btw_filings_freeze_household before update on btw_filings
  for each row execute function app.freeze_household();

-- ── 3. annual_tax_summaries ──────────────────────────────────────────────
-- Yearly income tax return (Inkomstenbelasting aangifte voor ondernemers).
create table annual_tax_summaries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  owner_user_id uuid not null references auth.users,
  year smallint not null check (year between 2020 and 2100),
  gross_income_cents bigint not null default 0,
  deductible_expenses_cents bigint not null default 0,
  profit_cents bigint not null default 0,
  zelfstandigenaftrek_cents bigint not null default 0,
  startersaftrek_cents bigint not null default 0,
  mkb_vrijstelling_cents bigint not null default 0,
  kia_cents bigint not null default 0,
  taxable_income_cents bigint not null default 0,
  estimated_tax_cents bigint not null default 0,
  box3_assets_cents bigint not null default 0,
  box3_debts_cents bigint not null default 0,
  box3_tax_cents bigint not null default 0,
  is_starter boolean not null default false,
  status text not null default 'in_progress' check (status in ('in_progress', 'ready', 'filed')),
  filed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, owner_user_id, year)
);

create index annual_tax_summaries_household_idx on annual_tax_summaries (household_id, year desc);

revoke all on table annual_tax_summaries from anon;
alter table annual_tax_summaries enable row level security;

create policy annual_tax_summaries_select on annual_tax_summaries for select to authenticated
  using (app.is_member(household_id));
create policy annual_tax_summaries_insert on annual_tax_summaries for insert to authenticated
  with check (app.is_member(household_id) and owner_user_id = auth.uid());
create policy annual_tax_summaries_update on annual_tax_summaries for update to authenticated
  using (app.is_member(household_id) and owner_user_id = auth.uid())
  with check (app.is_member(household_id));
create policy annual_tax_summaries_delete on annual_tax_summaries for delete to authenticated
  using (app.is_member(household_id) and owner_user_id = auth.uid());

create trigger annual_tax_summaries_touch_updated_at before update on annual_tax_summaries
  for each row execute function app.touch_updated_at();
create trigger annual_tax_summaries_freeze_household before update on annual_tax_summaries
  for each row execute function app.freeze_household();

-- ── 4. Extend transactions table with tax metadata ────────────────────────
alter table transactions
  add column if not exists btw_rate smallint check (btw_rate in (0, 9, 21)),
  add column if not exists btw_amount_cents bigint default 0,
  add column if not exists is_tax_deductible boolean default false;
