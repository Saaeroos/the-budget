-- pgTAP: tables that are read-only (or fully closed) to the authenticated
-- client role — bank_connections, sync_jobs, notifications, audit_log,
-- entitlements, nibud_reference, obligation_templates, bank_auth_nonces,
-- rate_limits. Every write on these happens through a service_role Edge
-- Function, which bypasses RLS entirely (docs/16 "service-role key ...
-- only for ... sync writes, cron jobs, entitlement writes").
begin;
select plan(16);

\set h1 '1a000000-0000-4000-8000-000000000101'
\set h2 '1a000000-0000-4000-8000-000000000102'
\set u1 '1a000000-0000-4000-8000-000000000111'
\set u2 '1a000000-0000-4000-8000-000000000112'
\set u3 '1a000000-0000-4000-8000-000000000113'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'u1', 'svc-u1@test.local', jsonb_build_object('household_id', :'h1')),
  (:'u2', 'svc-u2@test.local', jsonb_build_object('household_id', :'h2'));
insert into auth.users (id, email, raw_user_meta_data) values
  (:'u3', 'svc-u3@test.local', jsonb_build_object('join_household_id', :'h1'));

insert into bank_connections (id, household_id, owner_user_id, institution_id, institution_name) values
  ('1a000000-0000-4000-8000-000000000201', :'h1', :'u1', 'ING_INGBNL2A', 'ING');
insert into sync_jobs (id, household_id, connection_id) values
  ('1a000000-0000-4000-8000-000000000301', :'h1', '1a000000-0000-4000-8000-000000000201');
insert into notifications (id, household_id, user_id, type, scheduled_for) values
  ('1a000000-0000-4000-8000-000000000401', :'h1', :'u1', 'payday', now());
insert into audit_log (id, household_id, actor_user_id, action, entity) values
  ('1a000000-0000-4000-8000-000000000501', :'h1', :'u1', 'connection.created', 'bank_connections');
insert into entitlements (user_id, tier) values (:'u1', 'plus');

-- ── bank_connections / sync_jobs / audit_log: cross-tenant select ───────
select set_config('request.jwt.claim.sub', :'u2', false);
set role authenticated;
select is((select count(*)::int from bank_connections where household_id = :'h1'), 0, 'bank_connections: cross-tenant hidden');
select is((select count(*)::int from sync_jobs where household_id = :'h1'), 0, 'sync_jobs: cross-tenant hidden');
select is((select count(*)::int from audit_log where household_id = :'h1'), 0, 'audit_log: cross-tenant hidden');
select is((select count(*)::int from entitlements where user_id = :'u1'), 0, 'entitlements: another user''s entitlement hidden');
reset role;
select set_config('request.jwt.claim.sub', '', false);

-- ── notifications: personal to the user, not just the household ────────
select set_config('request.jwt.claim.sub', :'u3', false);
set role authenticated;
select is((select count(*)::int from notifications where id = '1a000000-0000-4000-8000-000000000401'), 0, 'notifications: another member''s notification hidden');
reset role;
select set_config('request.jwt.claim.sub', '', false);

select set_config('request.jwt.claim.sub', :'u1', false);
set role authenticated;
select is((select count(*)::int from notifications where id = '1a000000-0000-4000-8000-000000000401'), 1, 'notifications: a user sees their own notification');
select is((select count(*)::int from entitlements where user_id = :'u1'), 1, 'entitlements: a user sees their own entitlement');
reset role;
select set_config('request.jwt.claim.sub', '', false);

-- ── Writes to service-role-only tables are denied to authenticated ──────
select set_config('request.jwt.claim.sub', :'u1', false);
set role authenticated;
select throws_ok('insert into notifications (household_id, user_id, type, scheduled_for) values (' || quote_literal(:'h1') || ',' || quote_literal(:'u1') || ', ''weekly_digest'', now())', null, null, 'notifications: insert denied to authenticated');
select throws_ok('insert into audit_log (household_id, actor_user_id, action, entity) values (' || quote_literal(:'h1') || ',' || quote_literal(:'u1') || ', ''x'', ''y'')', null, null, 'audit_log: insert denied to authenticated');
select throws_ok('insert into entitlements (user_id, tier) values (' || quote_literal(:'u2') || ', ''plus'')', null, null, 'entitlements: insert denied to authenticated');
select throws_ok(format('insert into sync_jobs (household_id, connection_id) values (%L, %L)', :'h1', '1a000000-0000-4000-8000-000000000201'), null, null, 'sync_jobs: insert denied to authenticated');

-- ── Public reference tables: readable, not writable ─────────────────────
select ok((select count(*)::int from nibud_reference) >= 0, 'nibud_reference: select does not error for authenticated');
select ok((select count(*)::int from obligation_templates) > 0, 'obligation_templates: seeded rows readable by authenticated');
select throws_ok('insert into nibud_reference (household_type, income_band, category_key, amount_cents, source_year) values (''x'',''x'',''x'',0,2026)', null, null, 'nibud_reference: insert denied to authenticated');
reset role;
select set_config('request.jwt.claim.sub', '', false);

-- ── bank_auth_nonces / rate_limits: no table grant at all for
-- authenticated/anon (belt-and-braces beyond RLS), so even a bare SELECT is
-- a hard permission error rather than an empty result.
select set_config('request.jwt.claim.sub', :'u1', false);
set role authenticated;
select throws_ok('select count(*) from bank_auth_nonces', '42501', null, 'bank_auth_nonces: unreadable to authenticated (no table grant)');
select throws_ok('select count(*) from rate_limits', '42501', null, 'rate_limits: unreadable to authenticated (no table grant)');
reset role;
select set_config('request.jwt.claim.sub', '', false);

select * from finish();
rollback;
