/* ── Text ─────────────────────────────────────────────── */
export const MONEY_TEXT = {
  notInteger: 'money.cents: value must be an integer number of cents',
} as const;

/* ── Types ────────────────────────────────────────────── */

/**
 * An amount of money expressed as an integer number of eurocents.
 * Never a float, never a string. See CLAUDE.md §2, `.claude/rules/00-core.md`.
 */
export type Cents = number & { readonly __brand: 'Cents' };

export const LIMITS = {
  /** One euro, in cents — the unit `ceilTo`/`floorTo` round to for whole-euro contribution amounts. */
  centsPerEuro: 100,
  /** `ceilTo(median, LIMITS.centsPerFiveEuro)` rounds a suggested huishoudelijk line up to €5 (`docs/10` §3.1). */
  centsPerFiveEuro: 500,
} as const;
