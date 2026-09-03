-- pgTAP: categories, merchants.
-- docs/07 §4: "select allowed when household_id is null (system) or
-- app.is_member(household_id). Insert/update/delete only for own household
-- rows." — both tables share this exact shape.
begin;
select plan(9);

\set h1 '12000000-0000-4000-8000-000000000001'
\set h2 '12000000-0000-4000-8000-000000000002'
\set u1 '12000000-0000-4000-8000-000000000011'
\set u2 '12000000-0000-4000-8000-000000000012'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'u1', 'cat-u1@test.local', jsonb_build_object('household_id', :'h1')),
  (:'u2', 'cat-u2@test.local', jsonb_build_object('household_id', :'h2'));

insert into categories (id, household_id, "group", key, name_nl, name_en, icon, is_system, sort_order)
values ('13000000-0000-4000-8000-000000000001', :'h1', 'huishoudelijk', 'h1_only_cat', 'H1 categorie', 'H1 category', 'circle', false, 1);

insert into merchants (id, household_id, key, display_name, is_system)
values ('14000000-0000-4000-8000-000000000001', :'h1', 'h1_only_merchant', 'H1 Merchant', false);

select ok((select count(*)::int from categories where household_id is null) > 0, 'system categories exist (seed applied)');
select ok((select count(*)::int from merchants where household_id is null) > 0, 'system merchants exist (seed applied)');

-- As U2 (member of H2 only).
select set_config('request.jwt.claim.sub', :'u2', false);
set role authenticated;

select ok((select count(*)::int from categories where household_id is null) > 0, 'categories: system rows visible to any member');
select is((select count(*)::int from categories where id = '13000000-0000-4000-8000-000000000001'), 0, 'categories: another household''s custom category hidden');
select ok((select count(*)::int from merchants where household_id is null) > 0, 'merchants: system rows visible to any member');
select is((select count(*)::int from merchants where id = '14000000-0000-4000-8000-000000000001'), 0, 'merchants: another household''s custom merchant hidden');

-- RLS filters the target row to zero, not an error: the UPDATE "succeeds"
-- affecting nothing.
update categories set name_nl = 'Hacked' where id = '13000000-0000-4000-8000-000000000001';

reset role;
select set_config('request.jwt.claim.sub', '', false);

-- As U1 (owns H1): can see and edit their own custom category/merchant, the
-- attempted cross-tenant update above left it untouched, and a household
-- row cannot mint itself as "system".
select set_config('request.jwt.claim.sub', :'u1', false);
set role authenticated;

select is((select count(*)::int from categories where id = '13000000-0000-4000-8000-000000000001'), 1, 'categories: own household''s custom category visible');
select is(
  (select name_nl from categories where id = '13000000-0000-4000-8000-000000000001'),
  'H1 categorie',
  'categories: another household''s attempted update did not change the row'
);
select throws_ok(
  format(
    'insert into categories (household_id, "group", key, name_nl, name_en, icon, is_system, sort_order) values (%L, %L, %L, %L, %L, %L, %L, %L)',
    :'h1', 'huishoudelijk', 'sneaky_system', 'x', 'x', 'circle', true, 1
  ),
  null, null, 'categories: a household row cannot masquerade as is_system'
);

reset role;
select set_config('request.jwt.claim.sub', '', false);

select * from finish();
rollback;
