-- Kwartje — 09: merchants, rules, attachments, notifications, audit_log,
-- nibud_reference, obligation_templates, sync_jobs, rate_limits, entitlements.
-- Spec: docs/06-data-model.md §9; docs/07-supabase-schema.md §4;
--       docs/08-bank-sync-psd2.md (sync_jobs); docs/14-api-contracts.md §6
--       (rate_limits); docs/18-monetisation.md §4 (entitlements);
--       docs/02-market-nl.md §5 (obligation_templates, seeded by 03_nl_calendar).

-- ── merchants ────────────────────────────────────────────────────────────
create table merchants (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households on delete cascade,
  key text not null,
  display_name text not null,
  logo_asset text,
  default_category_id uuid references categories on delete set null,
  match_patterns text[] not null default '{}',
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchants_system_household_ck check (
    (is_system and household_id is null) or (not is_system and household_id is not null)
  )
);

create unique index merchants_system_key_uniq on merchants (key) where household_id is null;
create unique index merchants_household_key_uniq on merchants (household_id, key) where household_id is not null;
create index merchants_household_idx on merchants (household_id);
create index merchants_patterns_gin on merchants using gin (match_patterns);

revoke all on table merchants from anon;
alter table merchants enable row level security;

create policy merchants_select on merchants for select to authenticated
  using (household_id is null or app.is_member(household_id));
create policy merchants_insert on merchants for insert to authenticated
  with check (household_id is not null and app.is_member(household_id) and not is_system);
create policy merchants_update on merchants for update to authenticated
  using (household_id is not null and app.is_member(household_id))
  with check (household_id is not null and app.is_member(household_id) and not is_system);
create policy merchants_delete on merchants for delete to authenticated
  using (household_id is not null and app.is_member(household_id));

create trigger merchants_touch_updated_at before update on merchants
  for each row execute function app.touch_updated_at();
create trigger merchants_freeze_household before update on merchants
  for each row execute function app.freeze_household();

-- Forward FKs deferred from earlier migrations, now that merchants exists.
alter table transactions
  add constraint transactions_merchant_fk foreign key (merchant_id) references merchants (id) on delete set null;
alter table recurring_series
  add constraint recurring_series_merchant_fk foreign key (merchant_id) references merchants (id) on delete set null;

create index txn_merchant_idx on transactions (merchant_id) where merchant_id is not null;

-- ── rules ────────────────────────────────────────────────────────────────
-- docs/09 §3 for the conditions/actions jsonb shape.
create table rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  owner_user_id uuid not null references auth.users,
  scope scope_kind not null default 'household',
  priority int not null default 100,
  conditions jsonb not null,
  actions jsonb not null,
  is_enabled boolean not null default true,
  created_from text not null default 'user' check (created_from in ('user', 'learned')),
  hit_count int not null default 0,
  last_hit_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rules_household_idx on rules (household_id, priority);

revoke all on table rules from anon;
alter table rules enable row level security;

create policy rules_select on rules for select to authenticated
  using (app.can_read(household_id, scope, owner_user_id));
create policy rules_insert on rules for insert to authenticated
  with check (app.is_member(household_id) and owner_user_id = auth.uid());
create policy rules_update on rules for update to authenticated
  using (app.can_read(household_id, scope, owner_user_id))
  with check (app.is_member(household_id));
create policy rules_delete on rules for delete to authenticated
  using (app.can_read(household_id, scope, owner_user_id));

create trigger rules_touch_updated_at before update on rules
  for each row execute function app.touch_updated_at();
create trigger rules_freeze_household before update on rules
  for each row execute function app.freeze_household();

-- ── attachments ──────────────────────────────────────────────────────────
-- docs/06 §9 lists household_id directly, but a transaction can be
-- scope='personal': an attachment on a personal transaction must be equally
-- private, so its policies join transactions rather than trusting the
-- denormalised household_id alone.
create table attachments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions on delete cascade,
  household_id uuid not null references households on delete cascade,
  storage_path text not null,
  mime text not null,
  bytes bigint not null check (bytes > 0),
  ocr_json jsonb,
  created_at timestamptz not null default now()
);

create index attachments_txn_idx on attachments (transaction_id);

revoke all on table attachments from anon;
alter table attachments enable row level security;

create policy attachments_select on attachments for select to authenticated
  using (exists (
    select 1 from transactions t
    where t.id = attachments.transaction_id
      and t.household_id = attachments.household_id
      and app.can_read(t.household_id, t.scope, t.owner_user_id)
  ));
create policy attachments_insert on attachments for insert to authenticated
  with check (exists (
    select 1 from transactions t
    where t.id = attachments.transaction_id
      and t.household_id = attachments.household_id
      and app.is_member(t.household_id)
  ));
create policy attachments_update on attachments for update to authenticated
  using (exists (
    select 1 from transactions t
    where t.id = attachments.transaction_id
      and t.household_id = attachments.household_id
      and app.can_read(t.household_id, t.scope, t.owner_user_id)
  ))
  with check (exists (
    select 1 from transactions t
    where t.id = attachments.transaction_id
      and t.household_id = attachments.household_id
      and app.is_member(t.household_id)
  ));
create policy attachments_delete on attachments for delete to authenticated
  using (exists (
    select 1 from transactions t
    where t.id = attachments.transaction_id
      and t.household_id = attachments.household_id
      and app.can_read(t.household_id, t.scope, t.owner_user_id)
  ));

create trigger attachments_freeze_household before update on attachments
  for each row execute function app.freeze_household();

-- ── notifications ────────────────────────────────────────────────────────
-- Always personal to one user (docs/06 §9): no scope column, so the "a
-- personal row is invisible to another household member" invariant is
-- tested via user_id rather than scope_kind.
create table notifications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications (user_id, scheduled_for desc);

revoke all on table notifications from anon;
alter table notifications enable row level security;

create policy notifications_select on notifications for select to authenticated
  using (user_id = auth.uid() and app.is_member(household_id));
-- Only queue_notifications()/dispatch-notifications (docs/17 §3) write rows,
-- always via the service_role key, which bypasses RLS — no authenticated
-- client ever needs to insert or delete a notification directly.
create policy notifications_insert on notifications for insert to authenticated
  with check (false);
-- A user may only mark their own notifications read/dismissed, never rewrite
-- their content.
create policy notifications_update on notifications for update to authenticated
  using (user_id = auth.uid() and app.is_member(household_id))
  with check (user_id = auth.uid() and app.is_member(household_id));
create policy notifications_delete on notifications for delete to authenticated
  using (false);

create trigger notifications_freeze_household before update on notifications
  for each row execute function app.freeze_household();

-- ── audit_log ────────────────────────────────────────────────────────────
-- Append-only from the client's point of view: every write happens inside an
-- Edge Function using the service_role key (docs/16 §"service-role key ...
-- only for ... audit"), which bypasses RLS. Household members may only read.
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  actor_user_id uuid references auth.users,
  action text not null,
  entity text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  at timestamptz not null default now()
);

create index audit_log_household_idx on audit_log (household_id, at desc);

revoke all on table audit_log from anon;
alter table audit_log enable row level security;

create policy audit_log_select on audit_log for select to authenticated
  using (app.is_member(household_id));
create policy audit_log_insert on audit_log for insert to authenticated
  with check (false);
create policy audit_log_update on audit_log for update to authenticated
  using (false) with check (false);
create policy audit_log_delete on audit_log for delete to authenticated
  using (false);

-- ── nibud_reference ──────────────────────────────────────────────────────
-- docs/07 §4, verbatim: "readable by all authenticated users; writable only
-- by service role."
create table nibud_reference (
  id uuid primary key default gen_random_uuid(),
  household_type text not null,
  income_band text not null,
  category_key text not null,
  amount_cents bigint not null check (amount_cents >= 0),
  source_year int not null,
  source_note text
);

create index nibud_reference_lookup_idx on nibud_reference (household_type, income_band, category_key);

revoke all on table nibud_reference from anon;
alter table nibud_reference enable row level security;

create policy nibud_reference_select on nibud_reference for select to authenticated
  using (true);
create policy nibud_reference_insert on nibud_reference for insert to authenticated
  with check (false);
create policy nibud_reference_update on nibud_reference for update to authenticated
  using (false) with check (false);
create policy nibud_reference_delete on nibud_reference for delete to authenticated
  using (false);

-- ── obligation_templates ─────────────────────────────────────────────────
-- Not in docs/06/07's table list; docs/02 §5 requires "seeded
-- obligation_templates" for the NL financial calendar and docs/06 §8's
-- obligations.template_key needs something to point at. Modelled as a
-- global reference table with the same read-only-to-clients shape as
-- nibud_reference. See docs/DECISIONS.md.
create table obligation_templates (
  key text primary key,
  name text not null,
  category_key text not null,
  month smallint check (month between 1 and 12),
  typical_amount_min_cents bigint,
  typical_amount_max_cents bigint,
  instalments_common boolean not null default false,
  notes text
);

revoke all on table obligation_templates from anon;
alter table obligation_templates enable row level security;

create policy obligation_templates_select on obligation_templates for select to authenticated
  using (true);
create policy obligation_templates_insert on obligation_templates for insert to authenticated
  with check (false);
create policy obligation_templates_update on obligation_templates for update to authenticated
  using (false) with check (false);
create policy obligation_templates_delete on obligation_templates for delete to authenticated
  using (false);

-- ── sync_jobs ────────────────────────────────────────────────────────────
-- docs/08 §"chunked into a queue table sync_jobs(id, connection_id,
-- account_ref, from, to, cursor, state, attempts)". `from`/`to` are reserved
-- words in SQL, renamed range_from/range_to. household_id is added
-- (denormalised from bank_connections) because docs/14 has the client poll
-- sync_jobs "filtered by household_id" as the realtime fallback — that read
-- path needs a column to filter on without a join in the RLS policy.
create table sync_jobs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  connection_id uuid not null references bank_connections on delete cascade,
  account_ref text,
  range_from date,
  range_to date,
  cursor text,
  state text not null default 'queued' check (state in ('queued', 'running', 'done', 'error')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sync_jobs_household_idx on sync_jobs (household_id, created_at desc);
create index sync_jobs_connection_idx on sync_jobs (connection_id);

revoke all on table sync_jobs from anon;
alter table sync_jobs enable row level security;

-- Read-only to clients: they poll for progress, never write directly — the
-- sync Edge Function (service_role) owns every insert/update/delete.
create policy sync_jobs_select on sync_jobs for select to authenticated
  using (app.is_member(household_id));
create policy sync_jobs_insert on sync_jobs for insert to authenticated
  with check (false);
create policy sync_jobs_update on sync_jobs for update to authenticated
  using (false) with check (false);
create policy sync_jobs_delete on sync_jobs for delete to authenticated
  using (false);

create trigger sync_jobs_touch_updated_at before update on sync_jobs
  for each row execute function app.touch_updated_at();
create trigger sync_jobs_freeze_household before update on sync_jobs
  for each row execute function app.freeze_household();

-- ── rate_limits ──────────────────────────────────────────────────────────
-- docs/14 §6: "rate_limits(key, window_start, count) ... implemented in
-- _shared/ratelimit.ts". Pure backend bookkeeping, no household concept at
-- all — enabled RLS with zero policies denies every role except
-- service_role (which has BYPASSRLS).
create table rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 1,
  primary key (key, window_start)
);

revoke all on table rate_limits from anon, authenticated;
alter table rate_limits enable row level security;

-- ── entitlements ─────────────────────────────────────────────────────────
-- docs/18 §4, verbatim: "entitlements(user_id, tier, expires_at, source) ...
-- written by the subscription/sync Edge Function ... client reads them for
-- UI gating only."
create table entitlements (
  user_id uuid primary key references auth.users on delete cascade,
  tier text not null check (tier in ('free', 'plus', 'household')),
  expires_at timestamptz,
  source text,
  updated_at timestamptz not null default now()
);

revoke all on table entitlements from anon;
alter table entitlements enable row level security;

create policy entitlements_select on entitlements for select to authenticated
  using (user_id = auth.uid());
create policy entitlements_insert on entitlements for insert to authenticated
  with check (false);
create policy entitlements_update on entitlements for update to authenticated
  using (false) with check (false);
create policy entitlements_delete on entitlements for delete to authenticated
  using (false);
