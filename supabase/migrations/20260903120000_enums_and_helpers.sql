-- Kwartje — 01: extensions, enums, app schema helpers, trigger functions.
-- Spec: docs/07-supabase-schema.md §1, §2, §5; docs/06-data-model.md §2.

-- ── Extensions ───────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";
create extension if not exists "btree_gist";
create extension if not exists "pg_stat_statements";

alter database postgres set timezone to 'UTC';

-- ── Enums (docs/06 §2) ───────────────────────────────────────────────────
-- Note: the source doc lists a cadence value with a mangled CJK character
-- where "half_yearly" was intended (rendering/encoding artifact on '半').
-- Fixed here per the doc's own instruction: "Fix the typo when implementing".
create type category_group as enum (
  'vaste_lasten', 'reserveringen', 'huishoudelijk', 'vrij_besteedbaar', 'inkomen', 'overboeking'
);
create type txn_direction as enum ('in', 'out');
create type txn_status as enum ('booked', 'pending');
create type txn_source as enum ('bank', 'manual', 'import', 'split');
create type scope_kind as enum ('personal', 'household', 'business');
create type period_kind as enum ('calendar_month', 'custom_month', 'four_weeks');
create type rollover_mode as enum ('none', 'carry_surplus', 'carry_all');
create type envelope_kind as enum ('reservering', 'goal', 'tax', 'buffer');
create type connection_state as enum ('active', 'expiring', 'expired', 'error', 'revoked');
create type cadence as enum (
  'weekly', 'four_weekly', 'monthly', 'bimonthly', 'quarterly', 'half_yearly', 'yearly', 'irregular'
);

-- ── app schema: helpers used by every RLS policy ────────────────────────
create schema if not exists app;

-- Europe/Amsterdam business date from a timestamptz (docs/06: business dates
-- are always NL-local, never UTC-shifted).
create or replace function app.nl_date(ts timestamptz)
returns date language sql immutable
as $$ select (ts at time zone 'Europe/Amsterdam')::date; $$;

-- app.my_household_ids() / app.is_member() / app.can_read() are specified
-- here in docs/07 §2, but are defined in the next migration
-- (02_households_and_profiles.sql) instead: they are LANGUAGE SQL functions,
-- and unlike PL/pgSQL, Postgres parse-analyses a SQL-language function body
-- at CREATE FUNCTION time — my_household_ids() selects from
-- household_members, which does not exist until that migration runs, so
-- defining it here fails with "relation household_members does not exist".
-- Verified empirically against a real Postgres 16 instance while authoring
-- this migration set. See docs/DECISIONS.md.

-- ── Trigger functions (docs/07 §5) ──────────────────────────────────────

-- updated_at bookkeeping
create or replace function app.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- immutability of household_id (invariant I-1)
create or replace function app.freeze_household() returns trigger
language plpgsql as $$
begin
  if new.household_id is distinct from old.household_id then
    raise exception 'household_id is immutable';
  end if;
  return new;
end $$;

-- envelope saved_cents (invariant I-11)
create or replace function app.recalc_envelope_saved() returns trigger
language plpgsql as $$
begin
  update envelopes e set saved_cents = coalesce((
    select sum(case when c.kind = 'withdrawal' then -c.amount_cents else c.amount_cents end)
    from envelope_contributions c
    where c.envelope_id = e.id and c.kind in ('actual', 'withdrawal')
  ), 0)
  where e.id = coalesce(new.envelope_id, old.envelope_id);
  return null;
end $$;

-- protect user categorisation (invariant I-6)
create or replace function app.protect_user_category() returns trigger
language plpgsql as $$
begin
  if old.category_source = 'user' and new.category_source <> 'user'
     and new.category_id is distinct from old.category_id then
    new.category_id := old.category_id;
    new.category_source := 'user';
  end if;
  return new;
end $$;
