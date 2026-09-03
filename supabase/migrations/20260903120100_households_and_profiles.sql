-- Kwartje — 02: profiles, households, household_members, membership
-- helpers, signup bootstrap.
-- Spec: docs/06-data-model.md §3; docs/07-supabase-schema.md §2, §3, §4.
--
-- app.my_household_ids()/app.is_member()/app.can_read() are specified in
-- docs/07 §2 as living alongside the other app-schema helpers in
-- 01_enums_and_helpers.sql, but they are LANGUAGE SQL functions and
-- my_household_ids() selects from household_members — Postgres
-- parse-analyses a SQL-language function body at CREATE FUNCTION time (PL/
-- pgSQL bodies are not), so it cannot be defined before household_members
-- exists. They are defined here instead, right after that table. See
-- docs/DECISIONS.md.

-- ── profiles ─────────────────────────────────────────────────────────────
create table profiles (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text,
  locale text not null default 'nl-NL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

revoke all on table profiles from anon;
alter table profiles enable row level security;

-- profiles has no household_id/scope: it is a 1:1 extension of auth.users,
-- so its predicate is ownership, not app.can_read/app.is_member.
create policy profiles_select on profiles for select to authenticated
  using (user_id = auth.uid());
create policy profiles_insert on profiles for insert to authenticated
  with check (user_id = auth.uid());
create policy profiles_update on profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy profiles_delete on profiles for delete to authenticated
  using (user_id = auth.uid());

create trigger profiles_touch_updated_at before update on profiles
  for each row execute function app.touch_updated_at();

-- ── households ───────────────────────────────────────────────────────────
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mijn huishouden',
  period_kind period_kind not null default 'calendar_month',
  period_anchor_day smallint check (period_anchor_day between 1 and 28),
  period_anchor_date date,
  composition text check (composition in ('single', 'couple', 'couple_kids', 'single_kids')),
  adults smallint not null default 1,
  children smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint anchor_required check (
    (period_kind = 'calendar_month')
    or (period_kind = 'custom_month' and period_anchor_day is not null)
    or (period_kind = 'four_weeks' and period_anchor_date is not null)
  )
);

revoke all on table households from anon;
alter table households enable row level security;

-- ── household_members ────────────────────────────────────────────────────
create table household_members (
  household_id uuid not null references households on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  income_share_bps int not null default 10000,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index household_members_user_idx on household_members (user_id);

revoke all on table household_members from anon;
alter table household_members enable row level security;

-- ── Membership helpers (docs/07 §2) ─────────────────────────────────────
-- households the current user belongs to. Security definer + owned by the
-- migration role (which owns household_members) so this bypasses RLS on
-- household_members itself — this is what makes is_member()/can_read()
-- usable from *inside* household_members' own policies without infinite
-- recursion.
create or replace function app.my_household_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select household_id from household_members where user_id = auth.uid();
$$;

comment on function app.my_household_ids() is
  'Security definer on purpose: lets is_member/can_read be evaluated inside RLS policies on household_members itself without recursive policy evaluation. Never expose this function directly to clients as a table-returning RPC of tenant data.';

create or replace function app.is_member(h uuid)
returns boolean language sql stable
as $$ select h in (select app.my_household_ids()); $$;

-- the standard read predicate for tenant tables with a scope column
create or replace function app.can_read(h uuid, s scope_kind, owner uuid)
returns boolean language sql stable
as $$ select app.is_member(h) and (s <> 'personal' or owner = auth.uid()); $$;

-- Is the current user an owner of household h? Same security-definer
-- reasoning as my_household_ids(), local to this file since only
-- household_members' own policies need it.
create or replace function app.is_owner(h uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from household_members
    where household_id = h and user_id = auth.uid() and role = 'owner'
  );
$$;

-- ── households policies ──────────────────────────────────────────────────
create policy households_select on households for select to authenticated
  using (app.is_member(id));
-- Households are never created directly by client inserts: they are created
-- by app.handle_new_user() below (signup) or by future invite/merge RPCs,
-- both security definer and both re-checking membership before acting. A
-- direct client-side insert policy would let anyone mint an unowned
-- household, so insert/delete are deny-by-default for the authenticated role.
create policy households_insert on households for insert to authenticated
  with check (false);
create policy households_update on households for update to authenticated
  using (app.is_member(id)) with check (app.is_member(id));
create policy households_delete on households for delete to authenticated
  using (false);

create trigger households_touch_updated_at before update on households
  for each row execute function app.touch_updated_at();

-- ── household_members policies ───────────────────────────────────────────
-- docs/07 §4, verbatim: "a member may read the member list of their
-- households; only owner may insert/delete." The very first membership row
-- of a household (its owner) is created by app.handle_new_user() below,
-- which bypasses RLS as a security definer function — no client-facing
-- insert path is needed or granted for that bootstrap step.
create policy household_members_select on household_members for select to authenticated
  using (app.is_member(household_id));
create policy household_members_insert on household_members for insert to authenticated
  with check (app.is_owner(household_id));
create policy household_members_update on household_members for update to authenticated
  using (app.is_owner(household_id)) with check (app.is_owner(household_id));
create policy household_members_delete on household_members for delete to authenticated
  using (app.is_owner(household_id));

-- ── Signup bootstrap ─────────────────────────────────────────────────────
-- Every user gets a profile and at least one household on signup (docs/06
-- §3). Reads two optional keys from auth.users.raw_user_meta_data so local
-- dev/test fixtures can build deterministic, multi-member households:
--   household_id        — use this id instead of a random one
--   household_name      — override the default household name
--   join_household_id   — join this existing household as 'member' instead
--                          of creating a new one (e.g. a second partner)
--   income_share_bps    — income_share_bps for a join_household_id signup
-- None of these are ever populated from untrusted client input in
-- production: GoTrue signup metadata is user-supplied, so any *product*
-- feature that relies on join_household_id must be an invite flow that
-- verifies the inviter server-side before minting the metadata — this
-- trigger only wires the mechanism, not the trust decision.
create or replace function app.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  join_household uuid := nullif(meta->>'join_household_id', '')::uuid;
  new_household uuid;
begin
  insert into profiles (user_id, display_name, locale)
  values (new.id, meta->>'display_name', coalesce(meta->>'locale', 'nl-NL'))
  on conflict (user_id) do nothing;

  if join_household is not null then
    insert into household_members (household_id, user_id, role, income_share_bps)
    values (
      join_household,
      new.id,
      'member',
      coalesce((meta->>'income_share_bps')::int, 10000)
    )
    on conflict (household_id, user_id) do nothing;
  else
    new_household := coalesce(nullif(meta->>'household_id', '')::uuid, gen_random_uuid());

    insert into households (id, name)
    values (new_household, coalesce(meta->>'household_name', 'Mijn huishouden'))
    on conflict (id) do nothing;

    insert into household_members (household_id, user_id, role)
    values (new_household, new.id, 'owner')
    on conflict (household_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();
