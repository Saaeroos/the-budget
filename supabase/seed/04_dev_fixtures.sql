-- Kwartje — seed: local dev fixture households.
-- Spec: docs/19-testing-qa.md §3; docs/24-local-dev.md §4.
--
-- Three households: Sanne (P1, solo), Bram & Fleur (P2, couple with income
-- split), Youssef (P3, ZZP business/private mix). All data is synthetic —
-- no real IBAN, no real person (docs/16, .claude/rules/08-security.md).
--
-- Sanne's user id (00000000-0000-4000-8000-000000000001) and household id
-- (00000000-0000-4000-8000-0000000000a1) are fixed: docs/24 §2's dev auth
-- bypass and docs/19 §3's fixtures depend on these exact values.
--
-- Idempotent as a whole: everything below is skipped once Sanne's household
-- already exists, so re-running `pnpm db:seed` against a database that
-- already has fixture data is a no-op rather than an error or a duplicate.
-- Dates are computed relative to current_date (not hard-coded) so
-- "pnpm dev" always lands on a Vandaag with recent-looking data, however
-- long after this file was written it is actually run — see
-- docs/DECISIONS.md.

do $$
declare
  sanne_id uuid := '00000000-0000-4000-8000-000000000001';
  sanne_household uuid := '00000000-0000-4000-8000-0000000000a1';
  sanne_conn uuid := '00000000-0000-4000-8000-0000000000b1';
  sanne_acct uuid := '00000000-0000-4000-8000-0000000000c1';
  series_rent uuid := '00000000-0000-4000-8000-0000000000d1';
  series_energie uuid := '00000000-0000-4000-8000-0000000000d2';
  series_sport uuid := '00000000-0000-4000-8000-0000000000d3';
  env_vakantie uuid := '00000000-0000-4000-8000-0000000000e1';
  env_buffer uuid := '00000000-0000-4000-8000-0000000000e2';
  period_prev uuid;
  period_cur uuid;

  bram_id uuid := '00000000-0000-4000-8000-000000000002';
  fleur_id uuid := '00000000-0000-4000-8000-000000000003';
  bf_household uuid := '00000000-0000-4000-8000-0000000000a2';
  bf_conn uuid := '00000000-0000-4000-8000-0000000000b2';
  bf_joint uuid := '00000000-0000-4000-8000-0000000000c2';
  bf_bram_acct uuid := '00000000-0000-4000-8000-0000000000c3';
  bf_fleur_acct uuid := '00000000-0000-4000-8000-0000000000c4';
  bf_kot_benefit uuid := '00000000-0000-4000-8000-0000000000f1';
  bf_gemeentebel uuid := '00000000-0000-4000-8000-0000000000f2';
  bf_jaarafrek uuid := '00000000-0000-4000-8000-0000000000f3';

  youssef_id uuid := '00000000-0000-4000-8000-000000000004';
  youssef_household uuid := '00000000-0000-4000-8000-0000000000a3';
  youssef_btw uuid := '00000000-0000-4000-8000-0000000000f4';

  cat_boodschappen uuid;
  cat_huur uuid;
  cat_energie uuid;
  cat_sport uuid;
  cat_salaris uuid;
  cat_toeslagen uuid;
  cat_gemeentebelasting uuid;
  cat_zzp_omzet uuid;
  cat_uit_eten uuid;
  cat_overig uuid;
  -- Note: no plpgsql variables named after the generate_series() aliases
  -- used below (m, wk) — plpgsql resolves an ambiguous name in favour of
  -- the variable, which silently breaks a correlated column reference in
  -- the SELECT list. Keep it that way if this file is edited.
begin
  if exists (select 1 from households where id = sanne_household) then
    return; -- already seeded
  end if;

  select id into cat_boodschappen from categories where key = 'boodschappen' and household_id is null;
  select id into cat_huur from categories where key = 'huur' and household_id is null;
  select id into cat_energie from categories where key = 'energie' and household_id is null;
  select id into cat_sport from categories where key = 'sport' and household_id is null;
  select id into cat_salaris from categories where key = 'salaris' and household_id is null;
  select id into cat_toeslagen from categories where key = 'toeslagen' and household_id is null;
  select id into cat_gemeentebelasting from categories where key = 'gemeentebelasting' and household_id is null;
  select id into cat_zzp_omzet from categories where key = 'zzp_omzet' and household_id is null;
  select id into cat_uit_eten from categories where key = 'uit_eten_bezorgen' and household_id is null;
  select id into cat_overig from categories where key = 'overig' and household_id is null;

  -- ══ Household 1: Sanne — single, 1 ING account ═══════════════════════
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  values (
    sanne_id, 'dev@kwartje.local', crypt('devdevdev', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('household_id', sanne_household, 'household_name', 'Sanne', 'display_name', 'Sanne')
  );
  insert into auth.identities (user_id, identity_data, provider, provider_id)
  values (sanne_id, jsonb_build_object('sub', sanne_id::text, 'email', 'dev@kwartje.local'), 'email', sanne_id::text);

  update households set composition = 'single', adults = 1 where id = sanne_household;

  insert into bank_connections (id, household_id, owner_user_id, institution_id, institution_name, session_id, state, consented_at, expires_at, last_sync_at)
  values (sanne_conn, sanne_household, sanne_id, 'ING_INGBNL2A', 'ING', 'fixture-session-sanne', 'active', now() - interval '30 days', now() + interval '60 days', now() - interval '1 day');

  insert into bank_accounts (id, connection_id, household_id, owner_user_id, scope, iban_hash, iban_last4, display_name, official_name, account_type, include_in_budget, history_available_from)
  values (sanne_acct, sanne_conn, sanne_household, sanne_id, 'household', encode(digest('FIXTURE-IBAN-SANNE-ING-1', 'sha256'), 'hex'), '4171', 'Betaalrekening', 'S. de Vries', 'payment', true, current_date - interval '6 months');

  insert into recurring_series (id, household_id, owner_user_id, scope, name, category_id, cadence, typical_amount_cents, next_expected_on, last_seen_on, confidence, is_subscription, status, created_from) values
    (series_rent, sanne_household, sanne_id, 'household', 'Huur appartement', cat_huur, 'monthly', 95000, (date_trunc('month', current_date) + interval '1 month')::date, current_date, 0.98, false, 'active', 'detected'),
    (series_energie, sanne_household, sanne_id, 'household', 'Energie', cat_energie, 'monthly', 12500, (date_trunc('month', current_date) + interval '1 month')::date, current_date, 0.9, false, 'active', 'detected'),
    (series_sport, sanne_household, sanne_id, 'household', 'Basic-Fit abonnement', cat_sport, 'monthly', 3495, (date_trunc('month', current_date) + interval '1 month')::date, current_date, 0.95, true, 'active', 'detected');

  insert into envelopes (id, household_id, owner_user_id, kind, name, category_id, target_cents, target_date, monthly_contribution_cents) values
    (env_vakantie, sanne_household, sanne_id, 'reservering', 'Vakantie', null, 150000, (current_date + interval '5 months')::date, 25000),
    (env_buffer, sanne_household, sanne_id, 'buffer', 'Buffer', null, 500000, null, null);
  insert into envelope_contributions (envelope_id, amount_cents, kind, created_at)
  select env_vakantie, 25000, 'actual', m
  from generate_series(date_trunc('month', current_date) - interval '2 months', date_trunc('month', current_date), interval '1 month') as m;
  insert into envelope_contributions (envelope_id, amount_cents, kind, created_at) values (env_buffer, 20000, 'actual', now() - interval '3 months');

  -- 6 months of salary, rent, energie, sport-abonnement.
  insert into transactions (household_id, owner_user_id, scope, account_id, booked_at, direction, amount_cents, description_raw, description_clean, counterparty_name, category_id, category_source, category_confidence, status, source, dedupe_hash)
  select sanne_household, sanne_id, 'household', sanne_acct, (m + interval '23 days')::date, 'in', 285000,
         'SALARIS WERKGEVER BV', 'Salaris', 'Werkgever BV', cat_salaris, 'user', 1.00, 'booked', 'bank', 'sanne-salary-' || to_char(m, 'YYYYMM')
  from generate_series(date_trunc('month', current_date) - interval '5 months', date_trunc('month', current_date), interval '1 month') as m;

  insert into transactions (household_id, owner_user_id, scope, account_id, booked_at, direction, amount_cents, description_raw, description_clean, counterparty_name, category_id, category_source, category_confidence, series_id, status, source, dedupe_hash)
  select sanne_household, sanne_id, 'household', sanne_acct, (m + interval '1 day')::date, 'out', 95000,
         'SEPA OVERBOEKING VERHUURDER BV', 'Verhuurder BV', 'Verhuurder BV', cat_huur, 'series', 0.98, series_rent, 'booked', 'bank', 'sanne-rent-' || to_char(m, 'YYYYMM')
  from generate_series(date_trunc('month', current_date) - interval '5 months', date_trunc('month', current_date), interval '1 month') as m;

  insert into transactions (household_id, owner_user_id, scope, account_id, booked_at, direction, amount_cents, description_raw, description_clean, counterparty_name, category_id, category_source, category_confidence, series_id, status, source, dedupe_hash)
  select sanne_household, sanne_id, 'household', sanne_acct, (m + interval '2 days')::date, 'out', 12500,
         'SEPA INCASSO EMS ENERGIE', 'Eneco', 'Eneco', cat_energie, 'series', 0.9, series_energie, 'booked', 'bank', 'sanne-energie-' || to_char(m, 'YYYYMM')
  from generate_series(date_trunc('month', current_date) - interval '5 months', date_trunc('month', current_date), interval '1 month') as m;

  insert into transactions (household_id, owner_user_id, scope, account_id, booked_at, direction, amount_cents, description_raw, description_clean, counterparty_name, merchant_id, category_id, category_source, category_confidence, series_id, status, source, dedupe_hash)
  select sanne_household, sanne_id, 'household', sanne_acct, (m + interval '4 days')::date, 'out', 3495,
         'BASIC-FIT NEDERLAND', 'Basic-Fit', 'Basic-Fit', (select id from merchants where key = 'basic_fit' and household_id is null), cat_sport, 'series', 0.95, series_sport, 'booked', 'bank', 'sanne-sport-' || to_char(m, 'YYYYMM')
  from generate_series(date_trunc('month', current_date) - interval '5 months', date_trunc('month', current_date), interval '1 month') as m;

  -- ~26 weekly groceries runs, alternating merchant, a couple left
  -- deliberately low-confidence to populate the "Te controleren" queue.
  insert into transactions (household_id, owner_user_id, scope, account_id, booked_at, direction, amount_cents, description_raw, description_clean, counterparty_name, merchant_id, category_id, category_source, category_confidence, status, source, dedupe_hash)
  select sanne_household, sanne_id, 'household', sanne_acct,
         (current_date - (wk * 7 || ' days')::interval)::date, 'out',
         4200 + (wk % 5) * 650,
         'BEA, Betaalpas ALBERT HEIJN 1234', 'Albert Heijn 1234', 'Albert Heijn',
         (select id from merchants where key = 'albert_heijn' and household_id is null),
         cat_boodschappen,
         case when wk in (3, 11) then 'heuristic' else 'merchant' end,
         case when wk in (3, 11) then 0.65 else 0.85 end,
         'booked', 'bank', 'sanne-groceries-' || wk
  from generate_series(0, 25) as wk;

  insert into budget_periods (id, household_id, kind, starts_on, ends_on, label, is_current)
  values (gen_random_uuid(), sanne_household, 'calendar_month',
          (date_trunc('month', current_date) - interval '1 month')::date,
          (date_trunc('month', current_date) - interval '1 day')::date,
          app.nl_month_name(extract(month from date_trunc('month', current_date) - interval '1 month')::int)
            || ' ' || extract(year from date_trunc('month', current_date) - interval '1 month')::text,
          false)
  returning id into period_prev;

  -- Inserted directly rather than via rpc_current_period(): that RPC is
  -- security invoker and checks app.is_member() against auth.uid(), but
  -- this seed runs as the migration/service role with no JWT session, so
  -- it is never "a member" of anything as far as RLS is concerned.
  insert into budget_periods (id, household_id, kind, starts_on, ends_on, label, is_current)
  values (gen_random_uuid(), sanne_household, 'calendar_month',
          date_trunc('month', current_date)::date,
          (date_trunc('month', current_date) + interval '1 month' - interval '1 day')::date,
          app.nl_month_name(extract(month from current_date)::int) || ' ' || extract(year from current_date)::text,
          true)
  returning id into period_cur;

  insert into budget_lines (household_id, period_id, category_id, scope, planned_cents, rollover_mode) values
    (sanne_household, period_cur, cat_huur, 'household', 95000, 'none'),
    (sanne_household, period_cur, cat_energie, 'household', 13000, 'none'),
    (sanne_household, period_cur, cat_boodschappen, 'household', 35000, 'carry_surplus'),
    (sanne_household, period_cur, cat_sport, 'household', 3500, 'carry_surplus');

  -- ══ Household 2: Bram & Fleur — couple, income split 60/40 ═══════════
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  values (
    bram_id, 'dev2@kwartje.local', crypt('devdevdev', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('household_id', bf_household, 'household_name', 'Bram & Fleur', 'display_name', 'Bram')
  );
  insert into auth.identities (user_id, identity_data, provider, provider_id)
  values (bram_id, jsonb_build_object('sub', bram_id::text, 'email', 'dev2@kwartje.local'), 'email', bram_id::text);
  update household_members set income_share_bps = 6000 where household_id = bf_household and user_id = bram_id;
  update households set composition = 'couple_kids', adults = 2, children = 1 where id = bf_household;

  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  values (
    fleur_id, 'fleur@kwartje.local', crypt('devdevdev', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('join_household_id', bf_household, 'income_share_bps', 4000, 'display_name', 'Fleur')
  );
  insert into auth.identities (user_id, identity_data, provider, provider_id)
  values (fleur_id, jsonb_build_object('sub', fleur_id::text, 'email', 'fleur@kwartje.local'), 'email', fleur_id::text);

  insert into bank_connections (id, household_id, owner_user_id, institution_id, institution_name, session_id, state, consented_at, expires_at, last_sync_at)
  values (bf_conn, bf_household, bram_id, 'RABO_RABONL2U', 'Rabobank', 'fixture-session-bramfleur', 'active', now() - interval '45 days', now() + interval '45 days', now() - interval '1 day');

  insert into bank_accounts (id, connection_id, household_id, owner_user_id, scope, iban_hash, iban_last4, display_name, account_type, include_in_budget) values
    (bf_joint, bf_conn, bf_household, bram_id, 'household', encode(digest('FIXTURE-IBAN-BRAMFLEUR-JOINT', 'sha256'), 'hex'), '2201', 'Gezamenlijke rekening', 'joint', true),
    (bf_bram_acct, bf_conn, bf_household, bram_id, 'personal', encode(digest('FIXTURE-IBAN-BRAM-PERSOONLIJK', 'sha256'), 'hex'), '3302', 'Bram privé', 'payment', true),
    (bf_fleur_acct, bf_conn, bf_household, fleur_id, 'personal', encode(digest('FIXTURE-IBAN-FLEUR-PERSOONLIJK', 'sha256'), 'hex'), '4403', 'Fleur privé', 'payment', true);

  insert into benefits (id, household_id, owner_user_id, type, monthly_amount_cents, valid_from, last_confirmed_on)
  values (bf_kot_benefit, bf_household, fleur_id, 'kinderopvangtoeslag', 45000, current_date - interval '1 year', current_date - interval '10 days');

  insert into income_events (household_id, owner_user_id, scope, kind, name, expected_on, expected_amount_cents, cadence) values
    (bf_household, bram_id, 'personal', 'salary', 'Salaris Bram', (date_trunc('month', current_date) + interval '23 days')::date, 320000, 'monthly'),
    (bf_household, fleur_id, 'personal', 'salary', 'Salaris Fleur', (date_trunc('month', current_date) + interval '23 days')::date, 210000, 'monthly'),
    (bf_household, fleur_id, 'household', 'benefit', 'Kinderopvangtoeslag', (date_trunc('month', current_date) + interval '20 days')::date, 45000, 'monthly');

  insert into obligations (id, household_id, owner_user_id, scope, template_key, name, category_id, expected_amount_cents, expected_on, certainty, instalment_count)
  values (bf_gemeentebel, bf_household, bram_id, 'household', 'gemeentebelasting_jaarlijks', 'Gemeentebelasting', cat_gemeentebelasting, 180000, make_date(extract(year from current_date)::int, 2, 15), 'confirmed', 10);
  insert into obligation_instalments (obligation_id, due_on, amount_cents, status)
  select bf_gemeentebel, (make_date(extract(year from current_date)::int, 2, 15) + (n * interval '1 month'))::date, 18000,
         case when (make_date(extract(year from current_date)::int, 2, 15) + (n * interval '1 month'))::date < current_date then 'paid' else 'due' end
  from generate_series(0, 9) as n;

  insert into obligations (id, household_id, owner_user_id, scope, template_key, name, category_id, expected_amount_cents, expected_on, certainty)
  values (bf_jaarafrek, bf_household, bram_id, 'household', 'energie_jaarafrekening', 'Jaarafrekening energie', cat_energie, 22000, (date_trunc('year', current_date) + interval '2 months')::date, 'estimated');

  insert into transactions (household_id, owner_user_id, scope, account_id, booked_at, direction, amount_cents, description_raw, description_clean, counterparty_name, category_id, category_source, category_confidence, status, source, dedupe_hash)
  select bf_household, bram_id, 'household', bf_joint, (m + interval '1 day')::date, 'out', 145000,
         'SEPA OVERBOEKING HYPOTHEEK', 'Hypotheekverstrekker', 'Hypotheekverstrekker', cat_huur, 'merchant', 0.9, 'booked', 'bank', 'bf-mortgage-' || to_char(m, 'YYYYMM')
  from generate_series(date_trunc('month', current_date) - interval '2 months', date_trunc('month', current_date), interval '1 month') as m;

  insert into transactions (household_id, owner_user_id, scope, account_id, booked_at, direction, amount_cents, description_raw, description_clean, counterparty_name, merchant_id, category_id, category_source, category_confidence, status, source, dedupe_hash)
  select bf_household, bram_id, 'household', bf_joint, (m + interval '6 days')::date, 'out', 18500 + (extract(month from m)::int % 3) * 1200,
         'BEA, Betaalpas JUMBO', 'Jumbo', 'Jumbo', (select id from merchants where key = 'jumbo' and household_id is null), cat_boodschappen, 'merchant', 0.85, 'booked', 'bank', 'bf-groceries-' || to_char(m, 'YYYYMM')
  from generate_series(date_trunc('month', current_date) - interval '2 months', date_trunc('month', current_date), interval '1 month') as m;

  insert into transactions (household_id, owner_user_id, scope, account_id, booked_at, direction, amount_cents, description_raw, description_clean, counterparty_name, category_id, category_source, category_confidence, status, source, dedupe_hash)
  values (bf_household, fleur_id, 'personal', bf_fleur_acct, current_date - 4, 'out', 2900, 'BEA, Betaalpas ETOS', 'Etos', 'Etos', (select id from categories where key = 'persoonlijke_verzorging' and household_id is null), 'merchant', 0.85, 'booked', 'bank', 'bf-fleur-etos-1');

  -- ══ Household 3: Youssef — ZZP, irregular income, business/private mix ═
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  values (
    youssef_id, 'dev3@kwartje.local', crypt('devdevdev', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('household_id', youssef_household, 'household_name', 'Youssef', 'display_name', 'Youssef')
  );
  insert into auth.identities (user_id, identity_data, provider, provider_id)
  values (youssef_id, jsonb_build_object('sub', youssef_id::text, 'email', 'dev3@kwartje.local'), 'email', youssef_id::text);
  update households set composition = 'single', adults = 1 where id = youssef_household;

  -- Irregular ZZP invoices: three unevenly-sized income events over the
  -- last quarter, no fixed cadence.
  insert into income_events (household_id, owner_user_id, scope, kind, name, expected_on, expected_amount_cents, cadence) values
    (youssef_household, youssef_id, 'business', 'other', 'Factuur klant A', current_date - interval '55 days', 185000, 'irregular'),
    (youssef_household, youssef_id, 'business', 'other', 'Factuur klant B', current_date - interval '20 days', 92000, 'irregular'),
    (youssef_household, youssef_id, 'business', 'other', 'Factuur klant C', current_date - interval '3 days', 260000, 'irregular');

  insert into transactions (household_id, owner_user_id, scope, booked_at, direction, amount_cents, description_raw, description_clean, counterparty_name, category_id, category_source, category_confidence, status, source, dedupe_hash) values
    (youssef_household, youssef_id, 'business', (current_date - interval '55 days')::date, 'in', 185000, 'SEPA OVERBOEKING KLANT A BV', 'Klant A BV', 'Klant A BV', cat_zzp_omzet, 'user', 1.00, 'booked', 'manual', 'yz-invoice-a'),
    (youssef_household, youssef_id, 'business', (current_date - interval '20 days')::date, 'in', 92000, 'SEPA OVERBOEKING KLANT B', 'Klant B', 'Klant B', cat_zzp_omzet, 'user', 1.00, 'booked', 'manual', 'yz-invoice-b'),
    (youssef_household, youssef_id, 'business', (current_date - interval '3 days')::date, 'in', 260000, 'SEPA OVERBOEKING KLANT C', 'Klant C', 'Klant C', cat_zzp_omzet, 'user', 1.00, 'booked', 'manual', 'yz-invoice-c'),
    (youssef_household, youssef_id, 'household', (current_date - interval '10 days')::date, 'out', 5600, 'BEA, Betaalpas LIDL', 'Lidl', 'Lidl', cat_boodschappen, 'merchant', 0.85, 'booked', 'bank', 'yz-lidl-1'),
    (youssef_household, youssef_id, 'household', (current_date - interval '2 days')::date, 'out', 3200, 'THUISBEZORGD.NL', 'Thuisbezorgd', 'Thuisbezorgd', cat_uit_eten, 'merchant', 0.85, 'booked', 'bank', 'yz-thuisbezorgd-1'),
    (youssef_household, youssef_id, 'business', (current_date - interval '15 days')::date, 'out', 8900, 'MEDIAMARKT ROTTERDAM', 'MediaMarkt', 'MediaMarkt', cat_overig, 'merchant', 0.7, 'booked', 'bank', 'yz-laptop-accessoire');

  -- BTW: next quarterly filing, modelled as a single upcoming obligation
  -- (docs/02 §5); no dedicated VAT category in the fixed taxonomy (docs/06
  -- §6), so filed under 'overig' — see docs/DECISIONS.md.
  insert into obligations (id, household_id, owner_user_id, scope, name, category_id, expected_amount_cents, expected_on, certainty, notes)
  values (youssef_btw, youssef_household, youssef_id, 'business', 'BTW-aangifte', cat_overig, 95000,
          (date_trunc('quarter', current_date) + interval '3 months' + interval '1 month' - interval '1 day')::date,
          'estimated', 'Kwartaalaangifte omzetbelasting.');
end $$;
