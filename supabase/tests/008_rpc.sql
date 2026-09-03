-- pgTAP: rpc_current_period, rpc_roll_period, rpc_recategorise,
-- rpc_merge_transactions, and the not-implemented stubs (docs/07 §6).
begin;
select plan(24);

\set h_cal '1c000000-0000-4000-8000-000000000201'
\set h_custom '1c000000-0000-4000-8000-000000000202'
\set h_4wk '1c000000-0000-4000-8000-000000000203'
\set u1 '1c000000-0000-4000-8000-000000000211'
\set u2 '1c000000-0000-4000-8000-000000000212'
\set u3 '1c000000-0000-4000-8000-000000000213'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'u1', 'rpc-u1@test.local', jsonb_build_object('household_id', :'h_cal')),
  (:'u2', 'rpc-u2@test.local', jsonb_build_object('household_id', :'h_custom')),
  (:'u3', 'rpc-u3@test.local', jsonb_build_object('household_id', :'h_4wk'));

update households set period_kind = 'custom_month', period_anchor_day = 24 where id = :'h_custom';
update households set period_kind = 'four_weeks', period_anchor_date = current_date - 100 where id = :'h_4wk';

select id as cat_id from categories where key = 'boodschappen' and household_id is null \gset

-- ── rpc_current_period: calendar_month ──────────────────────────────────
select set_config('request.jwt.claim.sub', :'u1', false);
set role authenticated;

select ok(
  (select current_date between p.starts_on and p.ends_on from rpc_current_period(:'h_cal'::uuid) p),
  'rpc_current_period (calendar_month): covers today'
);
select is((select extract(day from p.starts_on)::int from rpc_current_period(:'h_cal'::uuid) p), 1, 'rpc_current_period (calendar_month): starts on the 1st');
select is(
  (select (rpc_current_period(:'h_cal'::uuid)).id = (rpc_current_period(:'h_cal'::uuid)).id),
  true,
  'rpc_current_period: idempotent, returns the same period on repeat calls'
);
select is((select count(*)::int from budget_periods where household_id = :'h_cal'), 1, 'rpc_current_period: creates exactly one period, not one per call');

reset role;
select set_config('request.jwt.claim.sub', '', false);

-- ── rpc_current_period: custom_month (anchor day 24) ────────────────────
select set_config('request.jwt.claim.sub', :'u2', false);
set role authenticated;

select ok(
  (select current_date between p.starts_on and p.ends_on from rpc_current_period(:'h_custom'::uuid) p),
  'rpc_current_period (custom_month): covers today'
);
select is((select extract(day from p.starts_on)::int from rpc_current_period(:'h_custom'::uuid) p), 24, 'rpc_current_period (custom_month): starts on the anchor day');
select is(
  (select extract(day from (p.ends_on + 1))::int from rpc_current_period(:'h_custom'::uuid) p),
  24,
  'rpc_current_period (custom_month): ends the day before the next anchor day'
);

reset role;
select set_config('request.jwt.claim.sub', '', false);

-- ── rpc_current_period: four_weeks ───────────────────────────────────────
select set_config('request.jwt.claim.sub', :'u3', false);
set role authenticated;

select ok(
  (select current_date between p.starts_on and p.ends_on from rpc_current_period(:'h_4wk'::uuid) p),
  'rpc_current_period (four_weeks): covers today'
);
select is((select p.ends_on - p.starts_on from rpc_current_period(:'h_4wk'::uuid) p), 27, 'rpc_current_period (four_weeks): 28-day window');
select is(
  (select mod((p.starts_on - h.period_anchor_date)::int, 28) from rpc_current_period(:'h_4wk'::uuid) p, households h where h.id = :'h_4wk'),
  0,
  'rpc_current_period (four_weeks): aligned to the anchor date'
);

reset role;
select set_config('request.jwt.claim.sub', '', false);

-- ── Non-member cannot call an RPC for someone else''s household ─────────
select set_config('request.jwt.claim.sub', :'u2', false);
set role authenticated;
select throws_ok(format('select rpc_current_period(%L::uuid)', :'h_cal'), null, null, 'rpc_current_period: raises for a non-member household');
reset role;
select set_config('request.jwt.claim.sub', '', false);

-- ── rpc_roll_period: rollover modes ──────────────────────────────────────
select set_config('request.jwt.claim.sub', :'u1', false);
set role authenticated;

select id as period1 from rpc_current_period(:'h_cal'::uuid) \gset
insert into budget_lines (household_id, period_id, category_id, scope, planned_cents, rollover_mode) values
  (:'h_cal', :'period1', :'cat_id', 'household', 10000, 'none');
insert into transactions (household_id, owner_user_id, booked_at, direction, amount_cents, category_id, dedupe_hash)
values (:'h_cal', :'u1', (select starts_on from budget_periods where id = :'period1'), 'out', 4000, :'cat_id', 'rpc-actual-1');

select rpc_roll_period(:'h_cal'::uuid, :'period1'::uuid) as period2 \gset
select is(
  (select carried_in_cents from budget_lines where period_id = :'period2' and category_id = :'cat_id'),
  0::bigint,
  'rpc_roll_period: rollover_mode=none always carries 0'
);
select is(
  (select rpc_roll_period(:'h_cal'::uuid, :'period1'::uuid)),
  :'period2'::uuid,
  'rpc_roll_period: calling it again for the same period is idempotent'
);

reset role;
select set_config('request.jwt.claim.sub', '', false);

-- ── rpc_recategorise ─────────────────────────────────────────────────────
select set_config('request.jwt.claim.sub', :'u1', false);
set role authenticated;

insert into transactions (id, household_id, owner_user_id, booked_at, direction, amount_cents, counterparty_iban_hash, dedupe_hash)
values ('1d000000-0000-4000-8000-000000000001', :'h_cal', :'u1', current_date, 'out', 500, 'ibanhash123', 'recat-1');
select rpc_recategorise('1d000000-0000-4000-8000-000000000001'::uuid, :'cat_id'::uuid, true);
select is((select category_source from transactions where id = '1d000000-0000-4000-8000-000000000001'), 'user', 'rpc_recategorise: sets category_source to ''user''');
select is((select category_confidence from transactions where id = '1d000000-0000-4000-8000-000000000001'), 1.00, 'rpc_recategorise: sets confidence to 1.00');
select is(
  (select count(*)::int from rules where household_id = :'h_cal' and created_from = 'learned'),
  1,
  'rpc_recategorise: learn=true creates exactly one learned rule'
);

-- ── rpc_merge_transactions ───────────────────────────────────────────────
insert into transactions (id, household_id, owner_user_id, booked_at, direction, amount_cents, category_id, category_source, note, tags, status, dedupe_hash)
values ('1e000000-0000-4000-8000-000000000001', :'h_cal', :'u1', current_date, 'out', 4200, :'cat_id', 'user', 'belangrijke notitie', array['tag1'], 'pending', 'merge-pending');
insert into transactions (id, household_id, owner_user_id, booked_at, direction, amount_cents, status, dedupe_hash)
values ('1e000000-0000-4000-8000-000000000002', :'h_cal', :'u1', current_date, 'out', 4200, 'booked', 'merge-booked');

select rpc_merge_transactions('1e000000-0000-4000-8000-000000000002'::uuid, '1e000000-0000-4000-8000-000000000001'::uuid);
select is((select category_source from transactions where id = '1e000000-0000-4000-8000-000000000002'), 'user', 'rpc_merge_transactions: preserves the dropped row''s user category');
select is((select note from transactions where id = '1e000000-0000-4000-8000-000000000002'), 'belangrijke notitie', 'rpc_merge_transactions: preserves the dropped row''s note');
select is((select tags from transactions where id = '1e000000-0000-4000-8000-000000000002'), array['tag1'], 'rpc_merge_transactions: preserves the dropped row''s tags');
select is((select count(*)::int from transactions where id = '1e000000-0000-4000-8000-000000000001'), 0, 'rpc_merge_transactions: the dropped transaction is deleted');

reset role;
select set_config('request.jwt.claim.sub', '', false);

-- ── Stubs raise, they don''t silently return ─────────────────────────────
select set_config('request.jwt.claim.sub', :'u1', false);
set role authenticated;
select throws_ok(format('select rpc_safe_to_spend(%L::uuid, current_date)', :'h_cal'), null, null, 'rpc_safe_to_spend: not implemented, raises');
select throws_ok(format('select * from rpc_forecast(%L::uuid, 30)', :'h_cal'), null, null, 'rpc_forecast: not implemented, raises');
select throws_ok(format('select rpc_export_household(%L::uuid)', :'h_cal'), null, null, 'rpc_export_household: not implemented, raises');
select throws_ok('select rpc_delete_account()', null, null, 'rpc_delete_account: not implemented, raises');
reset role;
select set_config('request.jwt.claim.sub', '', false);

select * from finish();
rollback;
