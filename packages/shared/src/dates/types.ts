/* ── Text ─────────────────────────────────────────────── */
export const DATES_TEXT = {
  invalidFormat: 'dates.nlDate: value is not a YYYY-MM-DD date string',
} as const;

/* ── Types ────────────────────────────────────────────── */

/**
 * A calendar (business) date, always `YYYY-MM-DD`, always interpreted in `Europe/Amsterdam`.
 * Never an instant — booking dates and period boundaries are dates, not timestamps, and must
 * never shift across a DST boundary (`docs/10` §1).
 */
export type NLDate = string & { readonly __brand: 'NLDate' };

export const LIMITS = {
  isoDatePattern: /^\d{4}-\d{2}-\d{2}$/,
  /** Monday is the first day of the week throughout the app (`docs/15` §1). */
  weekStartsOn: 1,
} as const;
