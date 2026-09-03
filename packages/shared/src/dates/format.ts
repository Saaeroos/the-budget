import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { parseNLDate } from './nl-date';
import type { NLDate } from './types';

/* ── Types ────────────────────────────────────────────── */
// (no additional types beyond ./types)

/* ── Implementation ───────────────────────────────────── */

const PATTERNS = {
  short: 'd MMM',
  withWeekday: 'EEEEEE d MMM',
  numeric: 'dd-MM-yyyy',
  monthLabel: 'MMMM yyyy',
} as const;

// date-fns's `nl` locale appends a full stop to abbreviated month/weekday tokens
// ('sep.', 'do.'); Dutch UI copy in this app never carries it (`docs/15` §1 examples).
function stripAbbreviationDot(formatted: string): string {
  return formatted.replace(/\./g, '');
}

/** `3 sep` — day and abbreviated month, no trailing dot. */
export function formatShort(date: NLDate): string {
  return stripAbbreviationDot(format(parseNLDate(date), PATTERNS.short, { locale: nl }));
}

/** `di 3 sep` — abbreviated weekday, day, abbreviated month. */
export function formatWithWeekday(date: NLDate): string {
  return stripAbbreviationDot(format(parseNLDate(date), PATTERNS.withWeekday, { locale: nl }));
}

/** `03-09-2026`. */
export function formatNumeric(date: NLDate): string {
  return format(parseNLDate(date), PATTERNS.numeric, { locale: nl });
}

/** `september 2026` — Dutch never capitalises month names, even at the start of a label. */
export function formatMonthLabel(date: NLDate): string {
  return format(parseNLDate(date), PATTERNS.monthLabel, { locale: nl }).toLowerCase();
}
