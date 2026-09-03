import { addMonths } from 'date-fns';
import { addDays, nlDateFromJsDate, parseNLDate, type NLDate } from '../dates';
import { CADENCE, type Cadence } from './types';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = { unknownCadence: 'addCadence: unknown cadence' } as const;

/* ── Types ────────────────────────────────────────────── */
// (Cadence lives in ./types)

const LIMITS = {
  weeklyDays: 7,
  fourWeeklyDays: 28,
  bimonthlyMonths: 2,
  quarterlyMonths: 3,
  halfYearlyMonths: 6,
  yearlyMonths: 12,
} as const;

/* ── Implementation ───────────────────────────────────── */

/**
 * Steps `date` forward by one occurrence of `cadence` (`docs/06` §2's `cadence` enum).
 * `irregular` has no defined interval — recycling or forecasting an irregular-cadence
 * item is a caller error the type system can't rule out, so this returns `date`
 * unchanged rather than guessing (docs/DECISIONS.md, 2026-09-03 — recycle cadence).
 */
export function addCadence(date: NLDate, cadence: Cadence): NLDate {
  switch (cadence) {
    case CADENCE.weekly:
      return addDays(date, LIMITS.weeklyDays);
    case CADENCE.fourWeekly:
      return addDays(date, LIMITS.fourWeeklyDays);
    case CADENCE.monthly:
      return nlDateFromJsDate(addMonths(parseNLDate(date), 1));
    case CADENCE.bimonthly:
      return nlDateFromJsDate(addMonths(parseNLDate(date), LIMITS.bimonthlyMonths));
    case CADENCE.quarterly:
      return nlDateFromJsDate(addMonths(parseNLDate(date), LIMITS.quarterlyMonths));
    case CADENCE.halfYearly:
      return nlDateFromJsDate(addMonths(parseNLDate(date), LIMITS.halfYearlyMonths));
    case CADENCE.yearly:
      return nlDateFromJsDate(addMonths(parseNLDate(date), LIMITS.yearlyMonths));
    case CADENCE.irregular:
      return date;
    default: {
      const exhaustive: never = cadence;
      throw new RangeError(`${TEXT.unknownCadence} ${String(exhaustive)}`);
    }
  }
}
