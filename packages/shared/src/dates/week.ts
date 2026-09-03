import { getISOWeek } from 'date-fns';
import { parseNLDate } from './nl-date';
import type { NLDate } from './types';

/* ── Types ────────────────────────────────────────────── */
// (no additional types beyond ./types)

/* ── Implementation ───────────────────────────────────── */

/** The ISO-8601 week number (Monday-first, `docs/15` §1's `week 36`). */
export function weekNumber(date: NLDate): number {
  return getISOWeek(parseNLDate(date));
}
