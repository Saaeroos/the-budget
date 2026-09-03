-- Kwartje — 10: v_period_actuals, RPC surface.
-- Spec: docs/07-supabase-schema.md §6; docs/10-budget-engine.md §1, §3.4.
--
-- Every RPC below lives in `public` (not `app`) because only schemas listed
-- in supabase/config.toml [api].schemas are exposed by PostgREST for
-- supabase-js's .rpc() — `app` is deliberately unlisted so its helpers can
-- never be called directly as an RPC. All are `security invoker`: they run
-- as the calling role, so every table they touch is still filtered by that
-- table's own RLS policies.

-- ── v_period_actuals ─────────────────────────────────────────────────────
-- docs/07 §6, verbatim: spend per category per period, respecting splits
-- (I-7), transfers and exclusions (I-5).
create view v_period_actuals as
with base as (
  select t.household_id, t.id, t.booked_at, t.direction, t.scope,
         coalesce(s.category_id, t.category_id) as category_id,
         coalesce(s.amount_cents, t.amount_cents) as amount_cents
  from transactions t
  left join transaction_splits s on s.transaction_id = t.id
  where not t.is_transfer and not t.is_excluded
)
select p.id as period_id, b.household_id, b.category_id, b.scope,
       sum(b.amount_cents) filter (where b.direction = 'out') as out_cents,
       sum(b.amount_cents) filter (where b.direction = 'in') as in_cents
from budget_periods p
join base b on b.household_id = p.household_id
           and b.booked_at between p.starts_on and p.ends_on
group by 1, 2, 3, 4;

-- ── Dutch month names, for period labels (docs/10 §1: "maart 2027",
-- "24 mrt – 23 apr"). Hard-coded rather than to_char(..., 'TMMonth') with an
-- nl_NL locale, since a bare Postgres server is not guaranteed to have that
-- locale installed — this keeps label generation locale-independent.
create or replace function app.nl_month_name(m int) returns text
language sql immutable as $$
  select (array[
    'januari', 'februari', 'maart', 'april', 'mei', 'juni',
    'juli', 'augustus', 'september', 'oktober', 'november', 'december'
  ])[m];
$$;

create or replace function app.nl_month_abbr(m int) returns text
language sql immutable as $$
  select (array['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'])[m];
$$;

-- ── rpc_current_period ───────────────────────────────────────────────────
create or replace function rpc_current_period(h uuid)
returns budget_periods
language plpgsql security invoker as $$
declare
  hh households%rowtype;
  existing budget_periods%rowtype;
  today date := app.nl_date(now());
  start_date date;
  end_date date;
  lbl text;
  base date;
  n int;
  period_no int;
begin
  if not app.is_member(h) then
    raise exception 'not a member of household %', h;
  end if;

  select * into existing from budget_periods
  where household_id = h and starts_on <= today and ends_on >= today
  limit 1;

  if found then
    if not existing.is_current then
      update budget_periods set is_current = false where household_id = h and is_current and id <> existing.id;
      update budget_periods set is_current = true where id = existing.id returning * into existing;
    end if;
    return existing;
  end if;

  select * into hh from households where id = h;
  if not found then
    raise exception 'household % not found', h;
  end if;

  if hh.period_kind = 'calendar_month' then
    start_date := date_trunc('month', today)::date;
    end_date := (date_trunc('month', today) + interval '1 month' - interval '1 day')::date;
    lbl := app.nl_month_name(extract(month from start_date)::int) || ' ' || extract(year from start_date)::text;

  elsif hh.period_kind = 'custom_month' then
    base := date_trunc('month', today)::date;
    if extract(day from today)::int >= hh.period_anchor_day then
      start_date := (base + (hh.period_anchor_day - 1) * interval '1 day')::date;
    else
      start_date := ((base - interval '1 month') + (hh.period_anchor_day - 1) * interval '1 day')::date;
    end if;
    end_date := (start_date + interval '1 month' - interval '1 day')::date;
    lbl := extract(day from start_date)::text || ' ' || app.nl_month_abbr(extract(month from start_date)::int)
      || ' – ' || extract(day from end_date)::text || ' ' || app.nl_month_abbr(extract(month from end_date)::int);

  else -- four_weeks
    n := floor((today - hh.period_anchor_date)::numeric / 28)::int;
    start_date := (hh.period_anchor_date + (n * 28) * interval '1 day')::date;
    end_date := (start_date + 27 * interval '1 day')::date;
    period_no := (((n % 13) + 13) % 13) + 1;
    lbl := 'periode ' || period_no::text || ' · ' || extract(year from start_date)::text;
  end if;

  update budget_periods set is_current = false where household_id = h and is_current;

  insert into budget_periods (household_id, kind, starts_on, ends_on, label, is_current)
  values (h, hh.period_kind, start_date, end_date, lbl, true)
  returning * into existing;

  return existing;
end;
$$;

-- ── rpc_roll_period ──────────────────────────────────────────────────────
-- docs/10 §3.4: creates the next period, applies rollover, freezes
-- carried_in_cents. "Invariant: rolling a period is idempotent" — running
-- this twice for the same from_period returns the same next period id
-- without creating a second one or re-applying rollover.
create or replace function rpc_roll_period(h uuid, from_period uuid)
returns uuid
language plpgsql security invoker as $$
declare
  prev budget_periods%rowtype;
  hh households%rowtype;
  next_start date;
  next_end date;
  lbl text;
  next_id uuid;
  line record;
  avail bigint;
  carry bigint;
begin
  if not app.is_member(h) then
    raise exception 'not a member of household %', h;
  end if;

  select * into prev from budget_periods where id = from_period and household_id = h;
  if not found then
    raise exception 'period % not found for household %', from_period, h;
  end if;

  select * into hh from households where id = h;
  next_start := prev.ends_on + 1;

  select id into next_id from budget_periods where household_id = h and starts_on = next_start;
  if found then
    return next_id; -- already rolled: idempotent no-op
  end if;

  if prev.kind = 'calendar_month' then
    next_end := (date_trunc('month', next_start) + interval '1 month' - interval '1 day')::date;
    lbl := app.nl_month_name(extract(month from next_start)::int) || ' ' || extract(year from next_start)::text;
  elsif prev.kind = 'custom_month' then
    next_end := (next_start + interval '1 month' - interval '1 day')::date;
    lbl := extract(day from next_start)::text || ' ' || app.nl_month_abbr(extract(month from next_start)::int)
      || ' – ' || extract(day from next_end)::text || ' ' || app.nl_month_abbr(extract(month from next_end)::int);
  else
    next_end := (next_start + 27 * interval '1 day')::date;
    lbl := 'periode '
      || ((((floor((next_start - hh.period_anchor_date)::numeric / 28)::int) % 13) + 13) % 13 + 1)::text
      || ' · ' || extract(year from next_start)::text;
  end if;

  update budget_periods set is_current = false where household_id = h and is_current;

  insert into budget_periods (household_id, kind, starts_on, ends_on, label, is_current)
  values (h, prev.kind, next_start, next_end, lbl, true)
  returning id into next_id;

  for line in
    select bl.*, coalesce(vpa.out_cents, 0) as actual_cents
    from budget_lines bl
    left join v_period_actuals vpa
      on vpa.period_id = bl.period_id and vpa.category_id = bl.category_id and vpa.scope = bl.scope
    where bl.period_id = from_period
  loop
    avail := line.planned_cents + line.carried_in_cents - line.actual_cents;
    carry := case line.rollover_mode
      when 'none' then 0
      when 'carry_surplus' then greatest(avail, 0)
      when 'carry_all' then avail
      else 0
    end;

    insert into budget_lines (
      household_id, period_id, category_id, owner_user_id, scope, planned_cents, rollover_mode, carried_in_cents, note
    )
    values (h, next_id, line.category_id, line.owner_user_id, line.scope, line.planned_cents, line.rollover_mode, carry, line.note)
    on conflict (period_id, category_id, scope) do nothing;
  end loop;

  return next_id;
end;
$$;

-- ── rpc_recategorise ─────────────────────────────────────────────────────
create or replace function rpc_recategorise(txn uuid, cat uuid, learn boolean default false)
returns void
language plpgsql security invoker as $$
declare
  t transactions%rowtype;
begin
  select * into t from transactions
  where id = txn and app.can_read(household_id, scope, owner_user_id);
  if not found then
    raise exception 'transaction % not found or not accessible', txn;
  end if;

  update transactions
  set category_id = cat, category_source = 'user', category_confidence = 1.00, updated_at = now()
  where id = txn;

  if learn and t.counterparty_iban_hash is not null then
    insert into rules (household_id, owner_user_id, scope, priority, conditions, actions, is_enabled, created_from)
    values (
      t.household_id, t.owner_user_id, t.scope, 100,
      jsonb_build_object('all', jsonb_build_array(
        jsonb_build_object('field', 'counterparty_iban_hash', 'op', 'eq', 'value', t.counterparty_iban_hash)
      )),
      jsonb_build_object('set_category_id', cat),
      true, 'learned'
    );
  end if;
end;
$$;

-- ── rpc_merge_transactions ───────────────────────────────────────────────
-- docs/06 §5, invariant I-8: merging never loses a user-set category, note,
-- tag or split. `drop` is the spec's parameter name (docs/07 §6); the SQL
-- keyword DROP is unreserved in Postgres's grammar so it is valid as a
-- plain identifier, but the pl/pgsql body below still refers to it via a
-- local variable to keep the function body unambiguous to read.
create or replace function rpc_merge_transactions(keep uuid, drop uuid)
returns void
language plpgsql security invoker as $$
declare
  drop_id uuid := drop;
  k transactions%rowtype;
  d transactions%rowtype;
begin
  select * into k from transactions where id = keep and app.can_read(household_id, scope, owner_user_id);
  if not found then
    raise exception 'transaction % not found or not accessible', keep;
  end if;

  select * into d from transactions where id = drop_id and app.can_read(household_id, scope, owner_user_id);
  if not found then
    raise exception 'transaction % not found or not accessible', drop_id;
  end if;

  if k.household_id <> d.household_id then
    raise exception 'cannot merge transactions from different households';
  end if;

  if d.category_source = 'user' and k.category_source <> 'user' then
    update transactions
    set category_id = d.category_id, category_source = 'user', category_confidence = 1.00
    where id = keep;
  end if;

  if k.note is null and d.note is not null then
    update transactions set note = d.note where id = keep;
  end if;

  if d.tags <> '{}' then
    update transactions set tags = (select array_agg(distinct tag) from unnest(k.tags || d.tags) as tag)
    where id = keep;
  end if;

  -- Re-point child rows onto the surviving transaction. Splits only move if
  -- `keep` has none of its own yet, so a real split set is never clobbered.
  if not exists (select 1 from transaction_splits where transaction_id = keep) then
    update transaction_splits set transaction_id = keep where transaction_id = drop_id;
  end if;
  update split_participants set transaction_id = keep where transaction_id = drop_id;
  update attachments set transaction_id = keep, household_id = k.household_id where transaction_id = drop_id;
  update series_occurrences set transaction_id = keep where transaction_id = drop_id;
  update obligation_instalments set transaction_id = keep where transaction_id = drop_id;
  update envelope_contributions set transaction_id = keep where transaction_id = drop_id;
  update income_events set actual_transaction_id = keep where actual_transaction_id = drop_id;

  delete from transactions where id = drop_id;
end;
$$;

-- ── Stubs (docs/07 §6 lists these; not implemented by this ticket) ───────
create or replace function rpc_safe_to_spend(h uuid, as_of date)
returns jsonb language plpgsql security invoker as $$
begin
  if not app.is_member(h) then raise exception 'not a member of household %', h; end if;
  raise exception 'not implemented: rpc_safe_to_spend (docs/10 §5)';
end;
$$;

create or replace function rpc_forecast(h uuid, days int)
returns table (day date, balance_cents bigint, low boolean)
language plpgsql security invoker as $$
begin
  if not app.is_member(h) then raise exception 'not a member of household %', h; end if;
  raise exception 'not implemented: rpc_forecast (docs/10 §6)';
end;
$$;

create or replace function rpc_export_household(h uuid)
returns jsonb language plpgsql security invoker as $$
begin
  if not app.is_member(h) then raise exception 'not a member of household %', h; end if;
  raise exception 'not implemented: rpc_export_household (AVG art. 20, docs/16)';
end;
$$;

create or replace function rpc_delete_account()
returns void language plpgsql security invoker as $$
begin
  raise exception 'not implemented: rpc_delete_account (docs/16)';
end;
$$;

-- Defense-in-depth, matching the "no table readable by anon" posture applied
-- everywhere else: anon has no JWT, so app.is_member() is always false for
-- it and every RPC above already raises — this just removes the call
-- capability outright rather than relying on that.
revoke execute on function rpc_current_period(uuid) from anon;
revoke execute on function rpc_roll_period(uuid, uuid) from anon;
revoke execute on function rpc_recategorise(uuid, uuid, boolean) from anon;
revoke execute on function rpc_merge_transactions(uuid, uuid) from anon;
revoke execute on function rpc_safe_to_spend(uuid, date) from anon;
revoke execute on function rpc_forecast(uuid, int) from anon;
revoke execute on function rpc_export_household(uuid) from anon;
revoke execute on function rpc_delete_account() from anon;
