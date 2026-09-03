import { addDays, eachDay, type NLDate } from '../dates';
import { cents, type Cents } from '../money';
import { TXN_DIRECTION, type CategoryGroup, type TxnDirection } from './types';

/* ── Types ────────────────────────────────────────────── */
export interface SpendTransaction {
  readonly bookedAt: NLDate;
  readonly direction: TxnDirection;
  readonly categoryGroup: CategoryGroup;
  readonly amountCents: Cents;
  readonly isTransfer: boolean;
  readonly isExcluded: boolean;
}

export interface TrailingWindow {
  /** The last day included in the window (inclusive). */
  readonly endsOn: NLDate;
  readonly days: number;
}

/* ── Implementation ───────────────────────────────────── */

const LIMITS = {
  /** The highest-spend days are excluded before taking the median, so one big outlier doesn't poison it (`docs/10` §6). */
  outlierExclusionRate: 0.02,
} as const;

function dailyTotalsInWindow(transactions: readonly SpendTransaction[], window: TrailingWindow, group: CategoryGroup): Map<NLDate, number> {
  const startsOn = addDays(window.endsOn, -(window.days - 1));
  const totals = new Map<NLDate, number>(eachDay(startsOn, window.days).map((day) => [day, 0]));
  for (const t of transactions) {
    if (t.direction !== TXN_DIRECTION.out || t.categoryGroup !== group || t.isTransfer || t.isExcluded) continue;
    const existing = totals.get(t.bookedAt);
    if (existing !== undefined) totals.set(t.bookedAt, existing + t.amountCents);
  }
  return totals;
}

function median(sortedAscending: readonly number[]): number {
  if (sortedAscending.length === 0) return 0;
  const mid = Math.floor(sortedAscending.length / 2);
  const isEven = sortedAscending.length % 2 === 0;
  // Non-null: for a non-empty array, `mid` (odd) and both `mid - 1`/`mid` (even) are
  // always in bounds, so there is no real "missing value" case left to fall back on.
  return isEven ? Math.round((sortedAscending[mid - 1]! + sortedAscending[mid]!) / 2) : sortedAscending[mid]!;
}

/**
 * The median daily spend in `group` over the trailing window, excluding the top 2% of
 * days by spend (`docs/10` §6) — a burn-rate estimate for `forecast`, so zero-spend days
 * count too: it is the amount to subtract from the balance on *every* day, not just the
 * days something happened to be bought (docs/DECISIONS.md, 2026-09-03 — trailing median population).
 */
export function trailingMedianDailySpend(transactions: readonly SpendTransaction[], window: TrailingWindow, group: CategoryGroup): Cents {
  const totals = [...dailyTotalsInWindow(transactions, window, group).values()].sort((a, b) => a - b);
  const excludeCount = Math.round(totals.length * LIMITS.outlierExclusionRate);
  const trimmed = excludeCount > 0 ? totals.slice(0, totals.length - excludeCount) : totals;
  return cents(median(trimmed));
}
