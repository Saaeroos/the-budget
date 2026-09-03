-- pgTAP: tables with no household_id/scope of their own — transaction_splits,
-- split_participants, attachments, series_occurrences, obligation_instalments,
-- envelope_contributions, balances. Each derives its tenancy from a parent
-- row (docs/06 §4/§7/§8 list no household_id on these), so RLS is a join
-- back to that parent. attachments additionally proves the transitive
-- personal-scope case: an attachment on a personal transaction is as
-- private as the transaction itself (docs/DECISIONS.md).
begin;
select plan(11);

\set h1 '15000000-0000-4000-8000-000000000001'
\set h2 '15000000-0000-4000-8000-000000000002'
\set u1 '15000000-0000-4000-8000-000000000011'
\set u2 '15000000-0000-4000-8000-000000000012'
\set u3 '15000000-0000-4000-8000-000000000013'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'u1', 'child-u1@test.local', jsonb_build_object('household_id', :'h1')),
  (:'u2', 'child-u2@test.local', jsonb_build_object('household_id', :'h2'));
insert into auth.users (id, email, raw_user_meta_data) values
  (:'u3', 'child-u3@test.local', jsonb_build_object('join_household_id', :'h1'));

select id as cat_id from categories where key = 'boodschappen' and household_id is null \gset

insert into transactions (id, household_id, owner_user_id, scope, booked_at, direction, amount_cents, dedupe_hash) values
  ('16000000-0000-4000-8000-000000000001', :'h1', :'u1', 'household', current_date, 'out', 5000, 'c1'),
  ('16000000-0000-4000-8000-000000000002', :'h1', :'u1', 'personal', current_date, 'out', 5000, 'c2'),
  ('16000000-0000-4000-8000-000000000003', :'h2', :'u2', 'household', current_date, 'out', 5000, 'c3');

insert into transaction_splits (id, transaction_id, category_id, amount_cents) values
  ('17000000-0000-4000-8000-000000000001', '16000000-0000-4000-8000-000000000001', :'cat_id', 5000),
  ('17000000-0000-4000-8000-000000000002', '16000000-0000-4000-8000-000000000003', :'cat_id', 5000);

insert into split_participants (id, transaction_id, name, owed_cents) values
  ('18000000-0000-4000-8000-000000000001', '16000000-0000-4000-8000-000000000001', 'Vriend', 2500),
  ('18000000-0000-4000-8000-000000000002', '16000000-0000-4000-8000-000000000003', 'Vriend', 2500);

insert into attachments (id, transaction_id, household_id, storage_path, mime, bytes) values
  ('19000000-0000-4000-8000-000000000001', '16000000-0000-4000-8000-000000000001', :'h1', 'h1/receipt.jpg', 'image/jpeg', 100),
  ('19000000-0000-4000-8000-000000000002', '16000000-0000-4000-8000-000000000002', :'h1', 'h1/personal-receipt.jpg', 'image/jpeg', 100),
  ('19000000-0000-4000-8000-000000000003', '16000000-0000-4000-8000-000000000003', :'h2', 'h2/receipt.jpg', 'image/jpeg', 100);

insert into recurring_series (id, household_id, owner_user_id, name, category_id, cadence, typical_amount_cents) values
  ('1a000000-0000-4000-8000-000000000001', :'h1', :'u1', 'H1 series', :'cat_id', 'monthly', 1000),
  ('1a000000-0000-4000-8000-000000000002', :'h2', :'u2', 'H2 series', :'cat_id', 'monthly', 1000);
insert into series_occurrences (id, series_id, expected_on, expected_amount_cents) values
  ('1b000000-0000-4000-8000-000000000001', '1a000000-0000-4000-8000-000000000001', current_date, 1000),
  ('1b000000-0000-4000-8000-000000000002', '1a000000-0000-4000-8000-000000000002', current_date, 1000);

insert into obligations (id, household_id, owner_user_id, name, category_id, expected_amount_cents, expected_on) values
  ('1c000000-0000-4000-8000-000000000001', :'h1', :'u1', 'H1 obligation', :'cat_id', 1000, current_date),
  ('1c000000-0000-4000-8000-000000000002', :'h2', :'u2', 'H2 obligation', :'cat_id', 1000, current_date);
insert into obligation_instalments (id, obligation_id, due_on, amount_cents) values
  ('1d000000-0000-4000-8000-000000000001', '1c000000-0000-4000-8000-000000000001', current_date, 1000),
  ('1d000000-0000-4000-8000-000000000002', '1c000000-0000-4000-8000-000000000002', current_date, 1000);

insert into envelopes (id, household_id, owner_user_id, name, target_cents) values
  ('1e000000-0000-4000-8000-000000000001', :'h1', :'u1', 'H1 envelope', 1000),
  ('1e000000-0000-4000-8000-000000000002', :'h2', :'u2', 'H2 envelope', 1000);
insert into envelope_contributions (id, envelope_id, amount_cents, kind) values
  ('1f000000-0000-4000-8000-000000000001', '1e000000-0000-4000-8000-000000000001', 500, 'actual'),
  ('1f000000-0000-4000-8000-000000000002', '1e000000-0000-4000-8000-000000000002', 500, 'actual');

insert into bank_connections (id, household_id, owner_user_id, institution_id, institution_name) values
  ('1a100000-0000-4000-8000-000000000001', :'h1', :'u1', 'ING_INGBNL2A', 'ING'),
  ('1a100000-0000-4000-8000-000000000002', :'h2', :'u2', 'ING_INGBNL2A', 'ING');
insert into bank_accounts (id, connection_id, household_id, owner_user_id, iban_hash, iban_last4, display_name, account_type) values
  ('1a200000-0000-4000-8000-000000000001', '1a100000-0000-4000-8000-000000000001', :'h1', :'u1', 'hh1', '0001', 'H1 account', 'payment'),
  ('1a200000-0000-4000-8000-000000000002', '1a100000-0000-4000-8000-000000000002', :'h2', :'u2', 'hh2', '0002', 'H2 account', 'payment');
insert into balances (id, account_id, as_of, kind, amount_cents) values
  ('1a300000-0000-4000-8000-000000000001', '1a200000-0000-4000-8000-000000000001', current_date, 'booked', 100000),
  ('1a300000-0000-4000-8000-000000000002', '1a200000-0000-4000-8000-000000000002', current_date, 'booked', 100000);

-- ══ As U2 (member of H2 only): none of H1's child rows are visible ══════
select set_config('request.jwt.claim.sub', :'u2', false);
set role authenticated;

select is((select count(*)::int from transaction_splits where id = '17000000-0000-4000-8000-000000000001'), 0, 'transaction_splits: cross-tenant hidden');
select is((select count(*)::int from split_participants where id = '18000000-0000-4000-8000-000000000001'), 0, 'split_participants: cross-tenant hidden');
select is((select count(*)::int from attachments where id = '19000000-0000-4000-8000-000000000001'), 0, 'attachments: cross-tenant hidden');
select is((select count(*)::int from series_occurrences where id = '1b000000-0000-4000-8000-000000000001'), 0, 'series_occurrences: cross-tenant hidden');
select is((select count(*)::int from obligation_instalments where id = '1d000000-0000-4000-8000-000000000001'), 0, 'obligation_instalments: cross-tenant hidden');
select is((select count(*)::int from envelope_contributions where id = '1f000000-0000-4000-8000-000000000001'), 0, 'envelope_contributions: cross-tenant hidden');
select is((select count(*)::int from balances where id = '1a300000-0000-4000-8000-000000000001'), 0, 'balances: cross-tenant hidden');

reset role;
select set_config('request.jwt.claim.sub', '', false);

-- ══ As U3 (member of H1, not owner of the personal transaction): the
-- attachment on U1's personal transaction is transitively personal too ══
select set_config('request.jwt.claim.sub', :'u3', false);
set role authenticated;

select is((select count(*)::int from attachments where id = '19000000-0000-4000-8000-000000000001'), 1, 'attachments: household-scope transaction''s attachment visible to fellow member');
select is((select count(*)::int from attachments where id = '19000000-0000-4000-8000-000000000002'), 0, 'attachments: personal transaction''s attachment hidden from fellow member');

reset role;
select set_config('request.jwt.claim.sub', '', false);

-- ══ As U1: sees both of their own rows, proving the join isn't overly
-- restrictive ══════════════════════════════════════════════════════════
select set_config('request.jwt.claim.sub', :'u1', false);
set role authenticated;
select is((select count(*)::int from transaction_splits where transaction_id = '16000000-0000-4000-8000-000000000001'), 1, 'transaction_splits: own row visible');
select is((select count(*)::int from attachments where household_id = :'h1'), 2, 'attachments: both own rows visible to their owner');
reset role;
select set_config('request.jwt.claim.sub', '', false);

select * from finish();
rollback;
