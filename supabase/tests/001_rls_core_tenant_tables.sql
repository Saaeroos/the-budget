-- pgTAP: cross-tenant and personal-scope RLS isolation for every tenant
-- table that carries its own (household_id, scope, owner_user_id) — the
-- app.can_read() shape. Run after migrations + 01_categories/02_merchants
-- seeds (needs at least one system category).
-- docs/06 §3: "RLS enforces household_id in (my households) AND (scope <>
-- 'personal' OR owner_user_id = auth.uid())" — this file proves both halves
-- for: bank_accounts, transactions, envelopes, budget_lines,
-- recurring_series, obligations, income_events, rules.
begin;
select plan(24);

\set h1 '10000000-0000-4000-8000-000000000001'
\set h2 '10000000-0000-4000-8000-000000000002'
\set u1 '10000000-0000-4000-8000-000000000011'
\set u2 '10000000-0000-4000-8000-000000000012'
\set u3 '10000000-0000-4000-8000-000000000013'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'u1', 'core-u1@test.local', jsonb_build_object('household_id', :'h1')),
  (:'u2', 'core-u2@test.local', jsonb_build_object('household_id', :'h2'));
insert into auth.users (id, email, raw_user_meta_data) values
  (:'u3', 'core-u3@test.local', jsonb_build_object('join_household_id', :'h1'));

select id as cat_id from categories where key = 'boodschappen' and household_id is null \gset

insert into bank_connections (id, household_id, owner_user_id, institution_id, institution_name)
values ('20000000-0000-4000-8000-000000000001', :'h1', :'u1', 'ING_INGBNL2A', 'ING'),
       ('20000000-0000-4000-8000-000000000002', :'h2', :'u2', 'ING_INGBNL2A', 'ING');

insert into budget_periods (id, household_id, kind, starts_on, ends_on, label)
values ('20000000-0000-4000-8000-000000000011', :'h1', 'calendar_month', '2026-01-01', '2026-01-31', 'jan');

-- ── bank_accounts ────────────────────────────────────────────────────────
insert into bank_accounts (id, connection_id, household_id, owner_user_id, scope, iban_hash, iban_last4, display_name, account_type)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', :'h1', :'u1', 'household', 'hashA', '0001', 'H1 shared', 'payment'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', :'h1', :'u1', 'personal', 'hashB', '0002', 'H1 personal', 'payment'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', :'h2', :'u2', 'household', 'hashC', '0003', 'H2 shared', 'payment');

-- ── transactions ─────────────────────────────────────────────────────────
insert into transactions (id, household_id, owner_user_id, scope, booked_at, direction, amount_cents, dedupe_hash)
values
  ('40000000-0000-4000-8000-000000000001', :'h1', :'u1', 'household', current_date, 'out', 1000, 't1'),
  ('40000000-0000-4000-8000-000000000002', :'h1', :'u1', 'personal', current_date, 'out', 1000, 't2'),
  ('40000000-0000-4000-8000-000000000003', :'h2', :'u2', 'household', current_date, 'out', 1000, 't3');

-- ── envelopes ────────────────────────────────────────────────────────────
insert into envelopes (id, household_id, owner_user_id, scope, name, target_cents)
values
  ('50000000-0000-4000-8000-000000000001', :'h1', :'u1', 'household', 'H1 shared potje', 1000),
  ('50000000-0000-4000-8000-000000000002', :'h1', :'u1', 'personal', 'H1 personal potje', 1000),
  ('50000000-0000-4000-8000-000000000003', :'h2', :'u2', 'household', 'H2 shared potje', 1000);

-- ── budget_lines ─────────────────────────────────────────────────────────
insert into budget_lines (id, household_id, period_id, category_id, owner_user_id, scope, planned_cents)
values
  ('60000000-0000-4000-8000-000000000001', :'h1', '20000000-0000-4000-8000-000000000011', :'cat_id', :'u1', 'household', 1000),
  ('60000000-0000-4000-8000-000000000002', :'h1', '20000000-0000-4000-8000-000000000011', :'cat_id', :'u1', 'personal', 1000);

-- ── recurring_series ─────────────────────────────────────────────────────
insert into recurring_series (id, household_id, owner_user_id, scope, name, category_id, cadence, typical_amount_cents)
values
  ('70000000-0000-4000-8000-000000000001', :'h1', :'u1', 'household', 'H1 shared series', :'cat_id', 'monthly', 1000),
  ('70000000-0000-4000-8000-000000000002', :'h1', :'u1', 'personal', 'H1 personal series', :'cat_id', 'monthly', 1000);

-- ── obligations ──────────────────────────────────────────────────────────
insert into obligations (id, household_id, owner_user_id, scope, name, category_id, expected_amount_cents, expected_on)
values
  ('80000000-0000-4000-8000-000000000001', :'h1', :'u1', 'household', 'H1 shared obligation', :'cat_id', 1000, current_date),
  ('80000000-0000-4000-8000-000000000002', :'h1', :'u1', 'personal', 'H1 personal obligation', :'cat_id', 1000, current_date);

-- ── income_events ────────────────────────────────────────────────────────
insert into income_events (id, household_id, owner_user_id, scope, kind, name, expected_on, expected_amount_cents, cadence)
values
  ('90000000-0000-4000-8000-000000000001', :'h1', :'u1', 'household', 'salary', 'H1 shared income', current_date, 1000, 'monthly'),
  ('90000000-0000-4000-8000-000000000002', :'h1', :'u1', 'personal', 'salary', 'H1 personal income', current_date, 1000, 'monthly');

-- ── rules ────────────────────────────────────────────────────────────────
insert into rules (id, household_id, owner_user_id, scope, conditions, actions)
values
  ('a0000000-0000-4000-8000-000000000001', :'h1', :'u1', 'household', '{}', '{}'),
  ('a0000000-0000-4000-8000-000000000002', :'h1', :'u1', 'personal', '{}', '{}');

-- ══ As U2 (member of H2 only): must see none of H1's rows ═══════════════
select set_config('request.jwt.claim.sub', :'u2', false);
set role authenticated;

select is((select count(*)::int from bank_accounts where household_id = :'h1'), 0, 'bank_accounts: cross-tenant hidden');
select is((select count(*)::int from transactions where household_id = :'h1'), 0, 'transactions: cross-tenant hidden');
select is((select count(*)::int from envelopes where household_id = :'h1'), 0, 'envelopes: cross-tenant hidden');
select is((select count(*)::int from budget_lines where household_id = :'h1'), 0, 'budget_lines: cross-tenant hidden');
select is((select count(*)::int from recurring_series where household_id = :'h1'), 0, 'recurring_series: cross-tenant hidden');
select is((select count(*)::int from obligations where household_id = :'h1'), 0, 'obligations: cross-tenant hidden');
select is((select count(*)::int from income_events where household_id = :'h1'), 0, 'income_events: cross-tenant hidden');
select is((select count(*)::int from rules where household_id = :'h1'), 0, 'rules: cross-tenant hidden');

reset role;
select set_config('request.jwt.claim.sub', '', false);

-- ══ As U3 (member of H1, not the owner of H1's personal rows) ═══════════
select set_config('request.jwt.claim.sub', :'u3', false);
set role authenticated;

select is((select count(*)::int from bank_accounts where id = '30000000-0000-4000-8000-000000000001'), 1, 'bank_accounts: household-scope row visible to fellow member');
select is((select count(*)::int from bank_accounts where id = '30000000-0000-4000-8000-000000000002'), 0, 'bank_accounts: personal-scope row hidden from fellow member');

select is((select count(*)::int from transactions where id = '40000000-0000-4000-8000-000000000001'), 1, 'transactions: household-scope row visible to fellow member');
select is((select count(*)::int from transactions where id = '40000000-0000-4000-8000-000000000002'), 0, 'transactions: personal-scope row hidden from fellow member');

select is((select count(*)::int from envelopes where id = '50000000-0000-4000-8000-000000000001'), 1, 'envelopes: household-scope row visible to fellow member');
select is((select count(*)::int from envelopes where id = '50000000-0000-4000-8000-000000000002'), 0, 'envelopes: personal-scope row hidden from fellow member');

select is((select count(*)::int from budget_lines where id = '60000000-0000-4000-8000-000000000001'), 1, 'budget_lines: household-scope row visible to fellow member');
select is((select count(*)::int from budget_lines where id = '60000000-0000-4000-8000-000000000002'), 0, 'budget_lines: personal-scope row hidden from fellow member');

select is((select count(*)::int from recurring_series where id = '70000000-0000-4000-8000-000000000001'), 1, 'recurring_series: household-scope row visible to fellow member');
select is((select count(*)::int from recurring_series where id = '70000000-0000-4000-8000-000000000002'), 0, 'recurring_series: personal-scope row hidden from fellow member');

select is((select count(*)::int from obligations where id = '80000000-0000-4000-8000-000000000001'), 1, 'obligations: household-scope row visible to fellow member');
select is((select count(*)::int from obligations where id = '80000000-0000-4000-8000-000000000002'), 0, 'obligations: personal-scope row hidden from fellow member');

select is((select count(*)::int from income_events where id = '90000000-0000-4000-8000-000000000001'), 1, 'income_events: household-scope row visible to fellow member');
select is((select count(*)::int from income_events where id = '90000000-0000-4000-8000-000000000002'), 0, 'income_events: personal-scope row hidden from fellow member');

select is((select count(*)::int from rules where id = 'a0000000-0000-4000-8000-000000000001'), 1, 'rules: household-scope row visible to fellow member');
select is((select count(*)::int from rules where id = 'a0000000-0000-4000-8000-000000000002'), 0, 'rules: personal-scope row hidden from fellow member');

reset role;
select set_config('request.jwt.claim.sub', '', false);

select * from finish();
rollback;
