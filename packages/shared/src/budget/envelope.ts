import type { NLDate } from '../dates';
import { ceilTo, cents, clamp, sub, type Cents } from '../money';
import { addCadence } from './cadence';
import { periodsBetween } from './period';
import type { Cadence, Envelope, EnvelopeWithTarget, HouseholdPeriodConfig } from './types';

/* ── Types ────────────────────────────────────────────── */
// (Envelope, EnvelopeWithTarget, Cadence live in ./types)

const LIMITS = {
  /** Contributions round up to whole euros (`docs/10` §4.1). */
  wholeEuroCents: 100,
} as const;

/* ── Implementation ───────────────────────────────────── */

/**
 * The monthly (per-period) amount still required to reach the target on time
 * (`docs/10` §4.1). A user override always wins; an open-ended potje (no `targetDate`)
 * requires manual contributions only, so this returns 0.
 */
export function monthlyContribution(e: Envelope, today: NLDate, cfg: HouseholdPeriodConfig): Cents {
  if (e.monthlyContributionCents != null) return e.monthlyContributionCents;
  const remaining = Math.max(0, sub(e.targetCents, e.savedCents));
  if (e.targetDate == null) return cents(0);
  const periods = periodsBetween(today, e.targetDate, cfg);
  return ceilTo(remaining / Math.max(1, periods), LIMITS.wholeEuroCents);
}

/** How much should be saved by `today` if progress had been perfectly linear (`docs/10` §4.3). */
export function expectedByNow(e: EnvelopeWithTarget, today: NLDate, cfg: HouseholdPeriodConfig): Cents {
  const total = periodsBetween(e.startedOn, e.targetDate, cfg);
  const elapsed = periodsBetween(e.startedOn, today, cfg);
  return cents(Math.round(e.targetCents * clamp(elapsed / total, 0, 1)));
}

/** How far behind `savedCents` is from the linear expectation — never negative (`docs/10` §4.3). */
export function behindBy(e: EnvelopeWithTarget, today: NLDate, cfg: HouseholdPeriodConfig): Cents {
  return cents(Math.max(0, expectedByNow(e, today, cfg) - e.savedCents));
}

/**
 * Withdraws `spent` from a recurring potje and advances its target to the next cadence,
 * retaining any surplus (`docs/10` §4.2).
 */
export function recycle(e: EnvelopeWithTarget, spent: Cents, cadence: Cadence): EnvelopeWithTarget {
  return {
    ...e,
    savedCents: cents(Math.max(0, e.savedCents - spent)),
    targetDate: addCadence(e.targetDate, cadence),
  };
}
