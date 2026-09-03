import { addDays as addDaysFns, differenceInCalendarDays } from 'date-fns';
import { nlDateFromJsDate, parseNLDate } from './nl-date';
import type { NLDate } from './types';

/* ── Types ────────────────────────────────────────────── */
// (no additional types beyond ./types)

/* ── Implementation ───────────────────────────────────── */

/**
 * Adds (or, negative, subtracts) whole calendar days to a date. Built on `date-fns`'s
 * `addDays`, which normalises through local calendar fields — never a raw millisecond
 * offset — so a DST transition never shifts the result by an hour.
 */
export function addDays(date: NLDate, amount: number): NLDate {
  return nlDateFromJsDate(addDaysFns(parseNLDate(date), amount));
}

/**
 * The number of calendar days from `from` to `to` (negative if `to` is earlier). Uses
 * `date-fns`'s `differenceInCalendarDays`, which compares calendar fields rather than
 * raw instants, so a DST boundary between the two dates never off-by-ones the count.
 */
export function daysBetween(from: NLDate, to: NLDate): number {
  return differenceInCalendarDays(parseNLDate(to), parseNLDate(from));
}

/** The `count` consecutive dates starting at (and including) `start`. */
export function eachDay(start: NLDate, count: number): readonly NLDate[] {
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}
