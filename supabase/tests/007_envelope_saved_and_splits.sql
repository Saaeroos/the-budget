-- pgTAP: invariant I-11 (app.recalc_envelope_saved) and the
-- transaction_splits sum-must-equal-parent invariant (docs/06 §4).
begin;
-- transaction_splits_sum_ck is DEFERRABLE INITIALLY DEFERRED (so a real,
-- multi-row multi-statement INSERT of a whole split set only fails once, at
-- commit) — but this whole test file is one transaction that ends in
-- ROLLBACK, which would never trigger a deferred check at all. Force
-- immediate checking for the duration of this test instead.
set constraints all immediate;

select plan(8);

\set h1 '1e000000-0000-4000-8000-000000000001'
\set u1 '1e000000-0000-4000-8000-000000000011'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'u1', 'env-u1@test.local', jsonb_build_object('household_id', :'h1'));

select id as cat_id from categories where key = 'boodschappen' and household_id is null \gset

-- ── I-11: saved_cents = sum(actual) - sum(withdrawal), kept live ────────
insert into envelopes (id, household_id, owner_user_id, name, target_cents)
values ('1f000000-0000-4000-8000-000000000001', :'h1', :'u1', 'Vakantie', 100000);
select is((select saved_cents from envelopes where id = '1f000000-0000-4000-8000-000000000001'), 0::bigint, 'envelopes: saved_cents starts at 0');

insert into envelope_contributions (id, envelope_id, amount_cents, kind) values
  ('20000000-0000-4000-8000-000000000001', '1f000000-0000-4000-8000-000000000001', 5000, 'actual'),
  ('20000000-0000-4000-8000-000000000002', '1f000000-0000-4000-8000-000000000001', 3000, 'actual');
select is((select saved_cents from envelopes where id = '1f000000-0000-4000-8000-000000000001'), 8000::bigint, 'envelopes: saved_cents sums actual contributions');

insert into envelope_contributions (id, envelope_id, amount_cents, kind) values
  ('20000000-0000-4000-8000-000000000003', '1f000000-0000-4000-8000-000000000001', 1500, 'withdrawal');
select is((select saved_cents from envelopes where id = '1f000000-0000-4000-8000-000000000001'), 6500::bigint, 'envelopes: saved_cents subtracts withdrawals');

-- A 'planned' contribution (not yet actual) must not move saved_cents.
insert into envelope_contributions (id, envelope_id, amount_cents, kind) values
  ('20000000-0000-4000-8000-000000000004', '1f000000-0000-4000-8000-000000000001', 9999, 'planned');
select is((select saved_cents from envelopes where id = '1f000000-0000-4000-8000-000000000001'), 6500::bigint, 'envelopes: a ''planned'' contribution does not affect saved_cents');

delete from envelope_contributions where id = '20000000-0000-4000-8000-000000000002';
select is((select saved_cents from envelopes where id = '1f000000-0000-4000-8000-000000000001'), 3500::bigint, 'envelopes: deleting a contribution recalculates saved_cents');

update envelope_contributions set amount_cents = 4000 where id = '20000000-0000-4000-8000-000000000001';
select is((select saved_cents from envelopes where id = '1f000000-0000-4000-8000-000000000001'), 2500::bigint, 'envelopes: editing a contribution recalculates saved_cents');

-- ── transaction_splits: sum must equal the parent's amount_cents ────────
insert into transactions (id, household_id, owner_user_id, booked_at, direction, amount_cents, dedupe_hash)
values ('21000000-0000-4000-8000-000000000001', :'h1', :'u1', current_date, 'out', 10000, 'split-parent');

select throws_ok(
  format(
    'insert into transaction_splits (transaction_id, category_id, amount_cents) values (%L, %L, 4000)',
    '21000000-0000-4000-8000-000000000001', :'cat_id'
  ),
  null, null, 'transaction_splits: a split set that does not sum to the parent amount is rejected at commit'
);

-- A correctly-summing split set is accepted. Both rows land in the same
-- statement, and a (deferrable) constraint trigger is checked once at the
-- end of the statement, not per row, so this is not a race with the check.
select lives_ok(
  format(
    'insert into transaction_splits (transaction_id, category_id, amount_cents) values (%L, %L, 4000), (%L, %L, 6000)',
    '21000000-0000-4000-8000-000000000001', :'cat_id', '21000000-0000-4000-8000-000000000001', :'cat_id'
  ),
  'transaction_splits: a split set that sums exactly to the parent amount is accepted'
);

select * from finish();
rollback;
