import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/* ── Text ─────────────────────────────────────────────── */
// (none — schema definitions carry no user-facing or logged strings)

/* ── Types ────────────────────────────────────────────── */

/** `category_groups` (`docs/06` §2) — the fixed enum, not a table users extend. */
export const CATEGORY_GROUP = {
  fixed: 'vaste_lasten',
  reserved: 'reserveringen',
  household: 'huishoudelijk',
  free: 'vrij_besteedbaar',
  income: 'inkomen',
  transfer: 'overboeking',
} as const;
export type CategoryGroup = (typeof CATEGORY_GROUP)[keyof typeof CATEGORY_GROUP];
const CATEGORY_GROUP_VALUES = Object.values(CATEGORY_GROUP) as [CategoryGroup, ...CategoryGroup[]];

export const SCOPE_KIND = { personal: 'personal', household: 'household', business: 'business' } as const;
export type ScopeKind = (typeof SCOPE_KIND)[keyof typeof SCOPE_KIND];
const SCOPE_KIND_VALUES = Object.values(SCOPE_KIND) as [ScopeKind, ...ScopeKind[]];

export const TXN_DIRECTION = { in: 'in', out: 'out' } as const;
export type TxnDirection = (typeof TXN_DIRECTION)[keyof typeof TXN_DIRECTION];

export const TXN_STATUS = { booked: 'booked', pending: 'pending' } as const;
export type TxnStatus = (typeof TXN_STATUS)[keyof typeof TXN_STATUS];

export const TXN_SOURCE = { bank: 'bank', manual: 'manual', import: 'import', split: 'split' } as const;
export type TxnSource = (typeof TXN_SOURCE)[keyof typeof TXN_SOURCE];

export const CATEGORY_SOURCE = {
  rule: 'rule',
  merchant: 'merchant',
  series: 'series',
  heuristic: 'heuristic',
  user: 'user',
  unset: 'unset',
} as const;
export type TxnCategorySource = (typeof CATEGORY_SOURCE)[keyof typeof CATEGORY_SOURCE];
const CATEGORY_SOURCE_VALUES = Object.values(CATEGORY_SOURCE) as [TxnCategorySource, ...TxnCategorySource[]];

export const PERIOD_KIND = { calendarMonth: 'calendar_month', customMonth: 'custom_month', fourWeeks: 'four_weeks' } as const;
export type PeriodKind = (typeof PERIOD_KIND)[keyof typeof PERIOD_KIND];

export const ROLLOVER_MODE = { none: 'none', carrySurplus: 'carry_surplus', carryAll: 'carry_all' } as const;
export type RolloverMode = (typeof ROLLOVER_MODE)[keyof typeof ROLLOVER_MODE];

export const ENVELOPE_KIND = { reservering: 'reservering', goal: 'goal', tax: 'tax', buffer: 'buffer' } as const;
export type EnvelopeKind = (typeof ENVELOPE_KIND)[keyof typeof ENVELOPE_KIND];

export const CADENCE = {
  weekly: 'weekly',
  fourWeekly: 'four_weekly',
  monthly: 'monthly',
  bimonthly: 'bimonthly',
  quarterly: 'quarterly',
  halfYearly: 'half_yearly',
  yearly: 'yearly',
  irregular: 'irregular',
} as const;
export type Cadence = (typeof CADENCE)[keyof typeof CADENCE];

export const SERIES_STATUS = { active: 'active', paused: 'paused', ended: 'ended' } as const;
export type SeriesStatus = (typeof SERIES_STATUS)[keyof typeof SERIES_STATUS];

export const OUTBOX_OP_VALUES = ['insert', 'update', 'delete'] as const;

/* ── Tables ───────────────────────────────────────────── */
// Mirrors `docs/06` §10: transactions (last 24 months), categories,
// budget_periods, budget_lines, envelopes, recurring_series, merchants,
// accounts, plus the outbox. Indexes per `docs/13` §5.

export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey(),
    householdId: text('household_id'),
    group: text('group', { enum: CATEGORY_GROUP_VALUES }).notNull(),
    key: text('key').notNull(),
    nameNl: text('name_nl').notNull(),
    nameEn: text('name_en').notNull(),
    icon: text('icon').notNull(),
    color: text('color').notNull(),
    parentId: text('parent_id'),
    isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    archivedAt: text('archived_at'),
  },
  (t) => [index('idx_categories_group').on(t.group)],
);

export const merchants = sqliteTable('merchants', {
  id: text('id').primaryKey(),
  householdId: text('household_id'),
  key: text('key').notNull(),
  displayName: text('display_name').notNull(),
  logoAsset: text('logo_asset'),
  defaultCategoryId: text('default_category_id'),
  matchPatterns: text('match_patterns', { mode: 'json' }).$type<readonly string[]>().notNull().default([]),
  isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  connectionId: text('connection_id'),
  householdId: text('household_id').notNull(),
  ownerUserId: text('owner_user_id').notNull(),
  scope: text('scope', { enum: SCOPE_KIND_VALUES }).notNull(),
  ibanHash: text('iban_hash'),
  ibanLast4: text('iban_last4'),
  displayName: text('display_name').notNull(),
  officialName: text('official_name'),
  accountType: text('account_type', { enum: ['payment', 'savings', 'card', 'joint'] }).notNull(),
  currency: text('currency').notNull().default('EUR'),
  includeInBudget: integer('include_in_budget', { mode: 'boolean' }).notNull().default(true),
  historyAvailableFrom: text('history_available_from'),
  archivedAt: text('archived_at'),
});

export const recurringSeries = sqliteTable('recurring_series', {
  id: text('id').primaryKey(),
  householdId: text('household_id').notNull(),
  scope: text('scope', { enum: SCOPE_KIND_VALUES }).notNull(),
  merchantId: text('merchant_id'),
  counterpartyIbanHash: text('counterparty_iban_hash'),
  name: text('name').notNull(),
  categoryId: text('category_id').notNull(),
  cadence: text('cadence', { enum: Object.values(CADENCE) as [Cadence, ...Cadence[]] }).notNull(),
  typicalAmountCents: integer('typical_amount_cents').notNull(),
  amountToleranceBps: integer('amount_tolerance_bps').notNull().default(0),
  nextExpectedOn: text('next_expected_on'),
  lastSeenOn: text('last_seen_on'),
  confidence: integer('confidence').notNull().default(0),
  isSubscription: integer('is_subscription', { mode: 'boolean' }).notNull().default(false),
  contractStartedOn: text('contract_started_on'),
  cancellableFrom: text('cancellable_from'),
  cancelUrl: text('cancel_url'),
  status: text('status', { enum: Object.values(SERIES_STATUS) as [SeriesStatus, ...SeriesStatus[]] })
    .notNull()
    .default('active'),
  createdFrom: text('created_from', { enum: ['detected', 'manual'] })
    .notNull()
    .default('detected'),
});

export const budgetPeriods = sqliteTable(
  'budget_periods',
  {
    id: text('id').primaryKey(),
    householdId: text('household_id').notNull(),
    kind: text('kind', { enum: Object.values(PERIOD_KIND) as [PeriodKind, ...PeriodKind[]] }).notNull(),
    startsOn: text('starts_on').notNull(),
    endsOn: text('ends_on').notNull(),
    label: text('label').notNull(),
    isCurrent: integer('is_current', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => [index('idx_budget_periods_household').on(t.householdId, t.startsOn)],
);

export const budgetLines = sqliteTable(
  'budget_lines',
  {
    id: text('id').primaryKey(),
    periodId: text('period_id').notNull(),
    householdId: text('household_id').notNull(),
    categoryId: text('category_id').notNull(),
    scope: text('scope', { enum: SCOPE_KIND_VALUES }).notNull(),
    plannedCents: integer('planned_cents').notNull(),
    rolloverMode: text('rollover_mode', { enum: Object.values(ROLLOVER_MODE) as [RolloverMode, ...RolloverMode[]] })
      .notNull()
      .default('none'),
    carriedInCents: integer('carried_in_cents').notNull().default(0),
    note: text('note'),
  },
  (t) => [index('idx_budget_lines_period').on(t.periodId)],
);

export const envelopes = sqliteTable(
  'envelopes',
  {
    id: text('id').primaryKey(),
    householdId: text('household_id').notNull(),
    ownerUserId: text('owner_user_id').notNull(),
    scope: text('scope', { enum: SCOPE_KIND_VALUES }).notNull(),
    kind: text('kind', { enum: Object.values(ENVELOPE_KIND) as [EnvelopeKind, ...EnvelopeKind[]] }).notNull(),
    name: text('name').notNull(),
    categoryId: text('category_id'),
    targetCents: integer('target_cents').notNull(),
    targetDate: text('target_date'),
    savedCents: integer('saved_cents').notNull().default(0),
    monthlyContributionCents: integer('monthly_contribution_cents'),
    autoContribute: integer('auto_contribute', { mode: 'boolean' }).notNull().default(false),
    linkedAccountId: text('linked_account_id'),
    priority: integer('priority').notNull().default(0),
    archivedAt: text('archived_at'),
  },
  (t) => [index('idx_envelopes_household').on(t.householdId)],
);

export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    householdId: text('household_id').notNull(),
    ownerUserId: text('owner_user_id').notNull(),
    scope: text('scope', { enum: SCOPE_KIND_VALUES }).notNull(),
    accountId: text('account_id'),
    externalId: text('external_id'),
    dedupeHash: text('dedupe_hash').notNull(),
    bookedAt: text('booked_at').notNull(),
    valueAt: text('value_at'),
    createdAt: text('created_at').notNull(),
    direction: text('direction', { enum: ['in', 'out'] }).notNull(),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('EUR'),
    originalAmountCents: integer('original_amount_cents'),
    originalCurrency: text('original_currency'),
    descriptionRaw: text('description_raw').notNull(),
    descriptionClean: text('description_clean').notNull(),
    counterpartyName: text('counterparty_name'),
    counterpartyIbanHash: text('counterparty_iban_hash'),
    merchantId: text('merchant_id'),
    categoryId: text('category_id'),
    categorySource: text('category_source', { enum: CATEGORY_SOURCE_VALUES }).notNull().default('unset'),
    categoryConfidence: integer('category_confidence').notNull().default(0),
    seriesId: text('series_id'),
    status: text('status', { enum: ['booked', 'pending'] }).notNull(),
    source: text('source', { enum: Object.values(TXN_SOURCE) as [TxnSource, ...TxnSource[]] }).notNull(),
    isTransfer: integer('is_transfer', { mode: 'boolean' }).notNull().default(false),
    transferPairId: text('transfer_pair_id'),
    isExcluded: integer('is_excluded', { mode: 'boolean' }).notNull().default(false),
    isReimbursable: integer('is_reimbursable', { mode: 'boolean' }).notNull().default(false),
    note: text('note'),
    tags: text('tags', { mode: 'json' }).$type<readonly string[]>().notNull().default([]),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [
    index('idx_transactions_booked_at').on(t.bookedAt),
    index('idx_transactions_category_booked').on(t.categoryId, t.bookedAt),
    index('idx_transactions_account_booked').on(t.accountId, t.bookedAt),
  ],
);

export const outbox = sqliteTable(
  'outbox',
  {
    id: text('id').primaryKey(),
    entity: text('entity').notNull(),
    entityId: text('entity_id').notNull(),
    op: text('op', { enum: OUTBOX_OP_VALUES }).notNull(),
    payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>().notNull(),
    createdAt: text('created_at').notNull(),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    // Extension beyond `docs/06` §10's column list — see `docs/DECISIONS.md`.
    nextAttemptAt: text('next_attempt_at'),
  },
  (t) => [index('idx_outbox_created_at').on(t.createdAt)],
);
