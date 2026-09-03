import { LIMITS, type Cents } from './types';

/* ── Text ─────────────────────────────────────────────── */
// Formatting symbols, not i18n keys — see docs/DECISIONS.md, 2026-09-03
// "speech/period-label words": these are the currency formatter's own output
// characters (like date-fns's locale data), not translatable UI copy.
const SYMBOLS = {
  euro: '€',
  nbsp: ' ',
  minus: '−',
  locale: 'nl-NL',
} as const;

/* ── Types ────────────────────────────────────────────── */
export interface FormatEurOptions {
  /**
   * `'auto'` hides `,00` on whole euros (compact chips, progress bars).
   * `'always'` shows two decimals everywhere (ledgers, detail rows). Default `'always'`.
   */
  readonly decimals?: 'auto' | 'always';
}

/* ── Implementation ───────────────────────────────────── */

// Constructed once at module scope and memoised per (locale, fraction digits) pair — never per call.
const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: string, fractionDigits: number): Intl.NumberFormat {
  const key = `${locale}:${fractionDigits}`;
  const cached = formatterCache.get(key);
  if (cached) return cached;
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  formatterCache.set(key, formatter);
  return formatter;
}

/**
 * Formats an amount of cents as Dutch currency: `€ 1.234,56` (non-breaking space after the
 * symbol, dot thousands, comma decimals) or, negative, `−€ 42,00` (U+2212 minus, never a
 * hyphen, never parentheses). A value of exactly zero never renders with a leading minus
 * (`docs/10` §10).
 */
export function formatEUR(amount: Cents, options: FormatEurOptions = {}): string {
  const decimals = options.decimals ?? 'always';
  const isNegative = amount < 0;
  const absoluteCents = Math.abs(amount);
  const isWholeEuro = absoluteCents % LIMITS.centsPerEuro === 0;
  const fractionDigits = decimals === 'auto' && isWholeEuro ? 0 : 2;

  const euros = absoluteCents / LIMITS.centsPerEuro;
  const digits = getFormatter(SYMBOLS.locale, fractionDigits).format(euros);
  const sign = isNegative ? SYMBOLS.minus : '';
  return `${sign}${SYMBOLS.euro}${SYMBOLS.nbsp}${digits}`;
}
