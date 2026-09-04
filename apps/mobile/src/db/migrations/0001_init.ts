/* ── Text ─────────────────────────────────────────────── */
// (none — SQL DDL only)

/* ── Types ────────────────────────────────────────────── */
// (none)

/* ── Implementation ───────────────────────────────────── */

/**
 * Initial device mirror schema (`docs/06` §10): transactions (last 24 months),
 * categories, budget_periods, budget_lines, envelopes, recurring_series,
 * merchants, accounts, plus the outbox. Column names mirror `../schema.ts`
 * exactly. `amount_cents > 0` mirrors Invariant I-4 as defence in depth.
 */
export const MIGRATION_0001_INIT_SQL = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  household_id TEXT,
  "group" TEXT NOT NULL,
  key TEXT NOT NULL,
  name_nl TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  parent_id TEXT,
  is_system INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_categories_group ON categories("group");

CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  household_id TEXT,
  key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  logo_asset TEXT,
  default_category_id TEXT,
  match_patterns TEXT NOT NULL DEFAULT '[]',
  is_system INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  connection_id TEXT,
  household_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  iban_hash TEXT,
  iban_last4 TEXT,
  display_name TEXT NOT NULL,
  official_name TEXT,
  account_type TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  include_in_budget INTEGER NOT NULL DEFAULT 1,
  history_available_from TEXT,
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS recurring_series (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  merchant_id TEXT,
  counterparty_iban_hash TEXT,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  cadence TEXT NOT NULL,
  typical_amount_cents INTEGER NOT NULL,
  amount_tolerance_bps INTEGER NOT NULL DEFAULT 0,
  next_expected_on TEXT,
  last_seen_on TEXT,
  confidence INTEGER NOT NULL DEFAULT 0,
  is_subscription INTEGER NOT NULL DEFAULT 0,
  contract_started_on TEXT,
  cancellable_from TEXT,
  cancel_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_from TEXT NOT NULL DEFAULT 'detected'
);

CREATE TABLE IF NOT EXISTS budget_periods (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL,
  label TEXT NOT NULL,
  is_current INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_budget_periods_household ON budget_periods(household_id, starts_on);

CREATE TABLE IF NOT EXISTS budget_lines (
  id TEXT PRIMARY KEY,
  period_id TEXT NOT NULL,
  household_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  planned_cents INTEGER NOT NULL,
  rollover_mode TEXT NOT NULL DEFAULT 'none',
  carried_in_cents INTEGER NOT NULL DEFAULT 0,
  note TEXT
);
CREATE INDEX IF NOT EXISTS idx_budget_lines_period ON budget_lines(period_id);

CREATE TABLE IF NOT EXISTS envelopes (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  category_id TEXT,
  target_cents INTEGER NOT NULL,
  target_date TEXT,
  saved_cents INTEGER NOT NULL DEFAULT 0,
  monthly_contribution_cents INTEGER,
  auto_contribute INTEGER NOT NULL DEFAULT 0,
  linked_account_id TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_envelopes_household ON envelopes(household_id);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  account_id TEXT,
  external_id TEXT,
  dedupe_hash TEXT NOT NULL,
  booked_at TEXT NOT NULL,
  value_at TEXT,
  created_at TEXT NOT NULL,
  direction TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  original_amount_cents INTEGER,
  original_currency TEXT,
  description_raw TEXT NOT NULL,
  description_clean TEXT NOT NULL,
  counterparty_name TEXT,
  counterparty_iban_hash TEXT,
  merchant_id TEXT,
  category_id TEXT,
  category_source TEXT NOT NULL DEFAULT 'unset',
  category_confidence INTEGER NOT NULL DEFAULT 0,
  series_id TEXT,
  status TEXT NOT NULL,
  source TEXT NOT NULL,
  is_transfer INTEGER NOT NULL DEFAULT 0,
  transfer_pair_id TEXT,
  is_excluded INTEGER NOT NULL DEFAULT 0,
  is_reimbursable INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transactions_booked_at ON transactions(booked_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category_booked ON transactions(category_id, booked_at);
CREATE INDEX IF NOT EXISTS idx_transactions_account_booked ON transactions(account_id, booked_at);

CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  op TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_attempt_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_outbox_created_at ON outbox(created_at);
`;
