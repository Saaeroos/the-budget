-- pgTAP: check constraints, the period exclusion constraint, and the
-- protect_user_category / household_id-immutability triggers.
begin;
select plan(12);

\set h1 '1b000000-0000-4000-8000-000000000001'
\set u1 '1b000000-0000-4000-8000-000000000011'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'u1', 'ck-u1@test.local', jsonb_build_object('household_id', :'h1'));

select id as cat_id from categories where key = 'boodschappen' and household_id is null \gset

-- ── I-4: amount_cents > 0 (transactions) ────────────────────────────────
select throws_ok(
  format('insert into transactions (household_id, owner_user_id, booked_at, direction, amount_cents, dedupe_hash) values (%L, %L, current_date, %L, 0, %L)', :'h1', :'u1', 'out', 'zero-amt'),
  '23514', null, 'transactions: amount_cents > 0 check rejects zero'
);
select throws_ok(
  format('insert into transactions (household_id, owner_user_id, booked_at, direction, amount_cents, dedupe_hash) values (%L, %L, current_date, %L, -100, %L)', :'h1', :'u1', 'out', 'neg-amt'),
  '23514', null, 'transactions: amount_cents > 0 check rejects negative'
);

-- ── envelopes.target_cents >= 0 ──────────────────────────────────────────
select throws_ok(
  format('insert into envelopes (household_id, owner_user_id, name, target_cents) values (%L, %L, %L, -1)', :'h1', :'u1', 'Negatief'),
  '23514', null, 'envelopes: target_cents >= 0 check rejects negative'
);

-- ── categories: is_system/household_id must agree ───────────────────────
select throws_ok(
  format('insert into categories (household_id, "group", key, name_nl, name_en, icon, is_system, sort_order) values (%L, %L, %L, %L, %L, %L, true, 1)', :'h1', 'huishoudelijk', 'bad_system', 'x', 'x', 'circle'),
  '23514', null, 'categories: is_system=true with a household_id is rejected'
);
select throws_ok(
  format('insert into categories (household_id, "group", key, name_nl, name_en, icon, is_system, sort_order) values (null, %L, %L, %L, %L, %L, false, 1)', 'huishoudelijk', 'bad_household', 'x', 'x', 'circle'),
  '23514', null, 'categories: is_system=false with no household_id is rejected'
);

-- ── budget_lines / recurring_series / obligations: personal scope needs
-- an owner (docs/DECISIONS.md) ──────────────────────────────────────────
insert into budget_periods (id, household_id, kind, starts_on, ends_on, label)
values ('1c000000-0000-4000-8000-000000000001', :'h1', 'calendar_month', '2026-01-01', '2026-01-31', 'jan');
select throws_ok(
  format('insert into budget_lines (household_id, period_id, category_id, scope, planned_cents) values (%L, %L, %L, %L, 100)', :'h1', '1c000000-0000-4000-8000-000000000001', :'cat_id', 'personal'),
  '23514', null, 'budget_lines: scope=personal without owner_user_id is rejected'
);

-- ── I-10: budget_periods exclusion constraint ────────────────────────────
select throws_ok(
  format('insert into budget_periods (household_id, kind, starts_on, ends_on, label) values (%L, %L, %L, %L, %L)', :'h1', 'calendar_month', '2026-01-15', '2026-02-15', 'overlap'),
  '23P01', null, 'budget_periods: exclusion constraint rejects an overlapping period'
);
select lives_ok(
  format('insert into budget_periods (household_id, kind, starts_on, ends_on, label) values (%L, %L, %L, %L, %L)', :'h1', 'calendar_month', '2026-02-01', '2026-02-28', 'feb'),
  'budget_periods: a contiguous, non-overlapping period is accepted'
);

-- ── I-1: household_id is immutable ───────────────────────────────────────
insert into transactions (id, household_id, owner_user_id, booked_at, direction, amount_cents, dedupe_hash)
values ('1d000000-0000-4000-8000-000000000001', :'h1', :'u1', current_date, 'out', 1000, 'freeze-me');
select throws_ok(
  format('update transactions set household_id = gen_random_uuid() where id = %L', '1d000000-0000-4000-8000-000000000001'),
  'P0001', null, 'transactions: household_id cannot be changed after creation'
);

-- ── I-6: protect_user_category ───────────────────────────────────────────
update transactions set category_id = :'cat_id', category_source = 'user' where id = '1d000000-0000-4000-8000-000000000001';
update transactions set category_id = null, category_source = 'heuristic' where id = '1d000000-0000-4000-8000-000000000001';
select is(
  (select category_source from transactions where id = '1d000000-0000-4000-8000-000000000001'),
  'user',
  'protect_user_category: category_source stays ''user'' when an automatic process tries to overwrite it'
);
select is(
  (select category_id from transactions where id = '1d000000-0000-4000-8000-000000000001'),
  :'cat_id',
  'protect_user_category: category_id is restored to the user''s choice, not the automatic overwrite'
);

-- A genuine further user edit (category_source stays 'user') is still
-- allowed through untouched.
update transactions set category_id = null, category_source = 'user' where id = '1d000000-0000-4000-8000-000000000001';
select is(
  (select category_id from transactions where id = '1d000000-0000-4000-8000-000000000001'),
  null,
  'protect_user_category: a real user re-edit (category_source still ''user'') is not blocked'
);

select * from finish();
rollback;
