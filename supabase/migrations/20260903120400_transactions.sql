-- Kwartje — 05: transactions, transaction_splits, split_participants.
-- Spec: docs/06-data-model.md §4, §5; docs/07-supabase-schema.md §3, §4, §5.

create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  owner_user_id uuid not null references auth.users,
  scope scope_kind not null default 'household',
  account_id uuid references bank_accounts on delete set null,
  external_id text,
  dedupe_hash text not null,
  booked_at date not null,
  value_at date,
  direction txn_direction not null,
  amount_cents bigint not null check (amount_cents > 0), -- invariant I-4
  currency text not null default 'EUR',
  original_amount_cents bigint,
  original_currency text,
  description_raw text not null default '',
  description_clean text not null default '',
  counterparty_name text,
  counterparty_iban_hash text,
  -- merchant_id/series_id reference tables created later in the migration
  -- order (merchants in 09_supporting, recurring_series in 08_recurring_*);
  -- the FK constraints are added there via ALTER TABLE once those tables
  -- exist, to avoid a forward reference at CREATE TABLE time.
  merchant_id uuid,
  category_id uuid references categories on delete set null,
  category_source text not null default 'unset'
    check (category_source in ('rule', 'merchant', 'series', 'heuristic', 'user', 'unset')),
  category_confidence numeric(3, 2) not null default 0
    check (category_confidence >= 0 and category_confidence <= 1),
  series_id uuid,
  status txn_status not null default 'booked',
  source txn_source not null default 'bank',
  is_transfer boolean not null default false,
  transfer_pair_id uuid,
  is_excluded boolean not null default false,
  is_reimbursable boolean not null default false,
  note text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index txn_external_uniq on transactions (account_id, external_id) where external_id is not null;
create unique index txn_dedupe_uniq on transactions (account_id, dedupe_hash) where external_id is null;
create index txn_household_date on transactions (household_id, booked_at desc);
create index txn_category on transactions (household_id, category_id, booked_at desc);
create index txn_search on transactions
  using gin (to_tsvector('dutch', coalesce(description_clean, '') || ' ' || coalesce(counterparty_name, '')));

revoke all on table transactions from anon;
alter table transactions enable row level security;

-- docs/07 §4, verbatim template.
create policy txn_select on transactions for select to authenticated
  using (app.can_read(household_id, scope, owner_user_id));
create policy txn_insert on transactions for insert to authenticated
  with check (app.is_member(household_id) and owner_user_id = auth.uid());
create policy txn_update on transactions for update to authenticated
  using (app.can_read(household_id, scope, owner_user_id))
  with check (app.is_member(household_id));
create policy txn_delete on transactions for delete to authenticated
  using (app.can_read(household_id, scope, owner_user_id));

create trigger txn_touch_updated_at before update on transactions
  for each row execute function app.touch_updated_at();
create trigger txn_freeze_household before update on transactions
  for each row execute function app.freeze_household();
-- invariant I-6: category_source = 'user' is never silently overwritten.
create trigger txn_protect_user_category before update on transactions
  for each row execute function app.protect_user_category();

-- ── transaction_splits ───────────────────────────────────────────────────
-- docs/06 §4 lists no household_id here; tenancy is derived via
-- transaction_id → transactions.
create table transaction_splits (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions on delete cascade,
  category_id uuid not null references categories,
  amount_cents bigint not null check (amount_cents > 0),
  note text
);

create index transaction_splits_txn_idx on transaction_splits (transaction_id);

revoke all on table transaction_splits from anon;
alter table transaction_splits enable row level security;

create policy transaction_splits_select on transaction_splits for select to authenticated
  using (exists (
    select 1 from transactions t
    where t.id = transaction_splits.transaction_id and app.can_read(t.household_id, t.scope, t.owner_user_id)
  ));
create policy transaction_splits_insert on transaction_splits for insert to authenticated
  with check (exists (
    select 1 from transactions t
    where t.id = transaction_splits.transaction_id and app.is_member(t.household_id)
  ));
create policy transaction_splits_update on transaction_splits for update to authenticated
  using (exists (
    select 1 from transactions t
    where t.id = transaction_splits.transaction_id and app.can_read(t.household_id, t.scope, t.owner_user_id)
  ))
  with check (exists (
    select 1 from transactions t
    where t.id = transaction_splits.transaction_id and app.is_member(t.household_id)
  ));
create policy transaction_splits_delete on transaction_splits for delete to authenticated
  using (exists (
    select 1 from transactions t
    where t.id = transaction_splits.transaction_id and app.can_read(t.household_id, t.scope, t.owner_user_id)
  ));

-- docs/06 §4: "sum of splits must equal the parent amount." A deferred
-- constraint trigger (rather than a plain AFTER trigger) so a multi-row
-- INSERT/UPDATE that builds up a full set of splits in one statement is only
-- checked once, at commit, not after each individual row.
create or replace function app.validate_transaction_splits() returns trigger
language plpgsql as $$
declare
  txn_id uuid := coalesce(new.transaction_id, old.transaction_id);
  txn_amount bigint;
  split_sum bigint;
begin
  select amount_cents into txn_amount from transactions where id = txn_id;
  if txn_amount is null then
    return null; -- parent transaction is gone (cascaded delete): nothing to check
  end if;

  select coalesce(sum(amount_cents), 0) into split_sum
  from transaction_splits where transaction_id = txn_id;

  if split_sum <> txn_amount then
    raise exception 'transaction_splits for % must sum to % cents, got %', txn_id, txn_amount, split_sum;
  end if;
  return null;
end;
$$;

create constraint trigger transaction_splits_sum_ck
  after insert or update or delete on transaction_splits
  deferrable initially deferred
  for each row execute function app.validate_transaction_splits();

-- ── split_participants ───────────────────────────────────────────────────
-- docs/06 §4, for F-21 (Tikkie-style shared expense settlement).
create table split_participants (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions on delete cascade,
  name text not null,
  contact_ref text,
  owed_cents bigint not null check (owed_cents >= 0),
  settled_at timestamptz,
  settle_method text check (settle_method in ('tikkie', 'wero', 'iban', 'cash', 'other'))
);

create index split_participants_txn_idx on split_participants (transaction_id);

revoke all on table split_participants from anon;
alter table split_participants enable row level security;

create policy split_participants_select on split_participants for select to authenticated
  using (exists (
    select 1 from transactions t
    where t.id = split_participants.transaction_id and app.can_read(t.household_id, t.scope, t.owner_user_id)
  ));
create policy split_participants_insert on split_participants for insert to authenticated
  with check (exists (
    select 1 from transactions t
    where t.id = split_participants.transaction_id and app.is_member(t.household_id)
  ));
create policy split_participants_update on split_participants for update to authenticated
  using (exists (
    select 1 from transactions t
    where t.id = split_participants.transaction_id and app.can_read(t.household_id, t.scope, t.owner_user_id)
  ))
  with check (exists (
    select 1 from transactions t
    where t.id = split_participants.transaction_id and app.is_member(t.household_id)
  ));
create policy split_participants_delete on split_participants for delete to authenticated
  using (exists (
    select 1 from transactions t
    where t.id = split_participants.transaction_id and app.can_read(t.household_id, t.scope, t.owner_user_id)
  ));
