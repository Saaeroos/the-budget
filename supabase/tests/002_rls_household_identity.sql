-- pgTAP: households, household_members, profiles.
-- docs/07 §4: "household_members: a member may read the member list of
-- their households; only owner may insert/delete." profiles is a 1:1
-- extension of auth.users, isolated by ownership rather than membership.
begin;
select plan(11);

\set h1 '11000000-0000-4000-8000-000000000001'
\set h2 '11000000-0000-4000-8000-000000000002'
\set u1 '11000000-0000-4000-8000-000000000011'
\set u2 '11000000-0000-4000-8000-000000000012'
\set u3 '11000000-0000-4000-8000-000000000013'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'u1', 'hh-u1@test.local', jsonb_build_object('household_id', :'h1', 'display_name', 'U1')),
  (:'u2', 'hh-u2@test.local', jsonb_build_object('household_id', :'h2', 'display_name', 'U2'));
insert into auth.users (id, email, raw_user_meta_data) values
  (:'u3', 'hh-u3@test.local', jsonb_build_object('join_household_id', :'h1'));

\set u4 '11000000-0000-4000-8000-000000000014'
insert into auth.users (id, email) values (:'u4', 'hh-u4@test.local');

-- Bootstrap trigger did its job.
select is((select count(*)::int from households where id = :'h1'), 1, 'signup created household H1');
select is((select role from household_members where household_id = :'h1' and user_id = :'u1'), 'owner', 'U1 is owner of H1');
select is((select role from household_members where household_id = :'h1' and user_id = :'u3'), 'member', 'U3 joined H1 as member');

-- households: cross-tenant select isolation.
select set_config('request.jwt.claim.sub', :'u2', false);
set role authenticated;
select is((select count(*)::int from households where id = :'h1'), 0, 'households: cross-tenant hidden');
select is((select count(*)::int from household_members where household_id = :'h1'), 0, 'household_members: cross-tenant member list hidden');
select is((select count(*)::int from profiles where user_id = :'u1'), 0, 'profiles: another user''s profile hidden');
reset role;
select set_config('request.jwt.claim.sub', '', false);

-- household_members: fellow member (U3) can read the member list, but
-- cannot insert a new member (only the owner may, per docs/07 §4).
select set_config('request.jwt.claim.sub', :'u3', false);
set role authenticated;
select is((select count(*)::int from household_members where household_id = :'h1'), 2, 'household_members: fellow member sees the full member list');
select is((select count(*)::int from profiles where user_id = :'u3'), 1, 'profiles: a user can read their own profile');
select throws_ok(
  format('insert into household_members (household_id, user_id, role) values (%L, %L, %L)', :'h1', :'u4', 'member'),
  '42501', null,
  'household_members: a non-owner member cannot insert a new member'
);
reset role;
select set_config('request.jwt.claim.sub', '', false);

-- household_members: the owner (U1) can insert a new member directly.
select set_config('request.jwt.claim.sub', :'u1', false);
set role authenticated;
select lives_ok(
  format('insert into household_members (household_id, user_id, role) values (%L, %L, %L)', :'h1', :'u4', 'member'),
  'household_members: the owner can insert a new member'
);
reset role;
select set_config('request.jwt.claim.sub', '', false);

-- households: direct client insert is always denied, even by its own future
-- owner — households are only ever created via app.handle_new_user().
select set_config('request.jwt.claim.sub', :'u1', false);
set role authenticated;
select throws_ok(
  'insert into households (id, name) values (gen_random_uuid(), ''Nope'')',
  '42501', null,
  'households: direct client insert is denied'
);
reset role;
select set_config('request.jwt.claim.sub', '', false);

select * from finish();
rollback;
