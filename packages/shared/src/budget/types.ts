import type { Cents } from '../money';
import type { NLDate } from '../dates';

/* ── Types ────────────────────────────────────────────── */

export const PERIOD_KIND = {
  calendarMonth: 'calendar_month',
  customMonth: 'custom_month',
  fourWeeks: 'four_weeks',
} as const;
export type PeriodKind = (typeof PERIOD_KIND)[keyof typeof PERIOD_KIND];

export const CATEGORY_GROUP = {
  fixed: 'vaste_lasten',
  reserved: 'reserveringen',
  household: 'huishoudelijk',
  free: 'vrij_besteedbaar',
  income: 'inkomen',
  transfer: 'overboeking',
} as const;
export type CategoryGroup = (typeof CATEGORY_GROUP)[keyof typeof CATEGORY_GROUP];

/** The four buckets that make up the household budget — `inkomen` and `overboeking` never are (`docs/10` §2). */
export const BUCKET_GROUP = {
  fixed: CATEGORY_GROUP.fixed,
  reserved: CATEGORY_GROUP.reserved,
  household: CATEGORY_GROUP.household,
  free: CATEGORY_GROUP.free,
} as const;
export type BucketGroup = (typeof BUCKET_GROUP)[keyof typeof BUCKET_GROUP];

/** Fixed display order — mirrors Nibud, never reordered by amount (`docs/10` §2). */
export const BUCKET_ORDER: readonly BucketGroup[] = [
  BUCKET_GROUP.fixed,
  BUCKET_GROUP.reserved,
  BUCKET_GROUP.household,
  BUCKET_GROUP.free,
];

export const ROLLOVER_MODE = {
  none: 'none',
  carrySurplus: 'carry_surplus',
  carryAll: 'carry_all',
} as const;
export type RolloverMode = (typeof ROLLOVER_MODE)[keyof typeof ROLLOVER_MODE];

/** Default rollover mode per bucket group (`docs/10` §3.4). */
export const DEFAULT_ROLLOVER_MODE: Readonly<Record<BucketGroup, RolloverMode>> = {
  [BUCKET_GROUP.fixed]: ROLLOVER_MODE.none,
  [BUCKET_GROUP.reserved]: ROLLOVER_MODE.carryAll,
  [BUCKET_GROUP.household]: ROLLOVER_MODE.carrySurplus,
  [BUCKET_GROUP.free]: ROLLOVER_MODE.none,
};

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

export const TXN_DIRECTION = { in: 'in', out: 'out' } as const;
export type TxnDirection = (typeof TXN_DIRECTION)[keyof typeof TXN_DIRECTION];

export const ACCOUNT_TYPE = {
  payment: 'payment',
  savings: 'savings',
  card: 'card',
  joint: 'joint',
} as const;
export type AccountType = (typeof ACCOUNT_TYPE)[keyof typeof ACCOUNT_TYPE];

/** A household's period configuration (`docs/06` §7, `docs/10` §1). */
export interface HouseholdPeriodConfig {
  readonly kind: PeriodKind;
  /** 1–31; only meaningful for `custom_month`. Values past a given month's length clamp (`docs/10` §1, §11). */
  readonly anchorDay?: number;
  /** Only meaningful for `four_weeks`: the start date of period #1 of the 13-period cycle. */
  readonly anchorDate?: NLDate;
}

export interface Period {
  readonly kind: PeriodKind;
  readonly startsOn: NLDate;
  readonly endsOn: NLDate;
  readonly label: string;
}

/** A budget line for one category in one period (`docs/06` §7, `docs/10` §3). */
export interface BudgetLine {
  readonly group: CategoryGroup;
  readonly plannedCents: Cents;
  readonly carriedInCents: Cents;
  readonly actualCents: Cents;
  readonly rolloverMode: RolloverMode;
}

export interface BucketTotals {
  readonly group: BucketGroup;
  readonly plannedCents: Cents;
  readonly carriedInCents: Cents;
  readonly actualCents: Cents;
  readonly remainingCents: Cents;
  readonly overCents: Cents;
}

/** A reserveringspotje (`docs/06` §7, `docs/10` §4). */
export interface Envelope {
  readonly monthlyContributionCents: Cents | null;
  readonly targetCents: Cents;
  readonly savedCents: Cents;
  readonly targetDate: NLDate | null;
  readonly startedOn: NLDate;
}

/** An envelope known to have a target date — the type-level guarantee `expectedByNow`/`behindBy` need. */
export type EnvelopeWithTarget = Envelope & { readonly targetDate: NLDate };
