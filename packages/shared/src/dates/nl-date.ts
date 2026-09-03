import { DATES_TEXT, LIMITS, type NLDate } from './types';

/* ── Types ────────────────────────────────────────────── */
// (no additional types beyond ./types)

/* ── Implementation ───────────────────────────────────── */

/**
 * Brands a `YYYY-MM-DD` string as an `NLDate`, rejecting malformed strings and
 * calendar-invalid dates (e.g. `2026-02-30`, which `Date` would otherwise silently
 * roll over into March).
 */
export function nlDate(value: string): NLDate {
  if (!LIMITS.isoDatePattern.test(value)) {
    throw new RangeError(DATES_TEXT.invalidFormat);
  }
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const roundTrip = new Date(year, month - 1, day);
  const isRealDate =
    roundTrip.getFullYear() === year && roundTrip.getMonth() === month - 1 && roundTrip.getDate() === day;
  if (!isRealDate) {
    throw new RangeError(DATES_TEXT.invalidFormat);
  }
  return value as NLDate;
}

/**
 * Parses an `NLDate` into a `Date` holding those calendar fields at local midnight, for
 * use with `date-fns`. The reverse of `nlDateFromJsDate`. Never carries a time-of-day —
 * business dates are dates, not instants (`docs/06` conventions).
 */
export function parseNLDate(value: NLDate): Date {
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  return new Date(year, month - 1, day);
}

/** Reads a `Date`'s local calendar fields back into an `NLDate` string. */
export function nlDateFromJsDate(date: Date): NLDate {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as NLDate;
}
