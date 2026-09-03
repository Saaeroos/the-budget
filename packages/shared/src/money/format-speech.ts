import { LIMITS, type Cents } from './types';

/* ── Text ─────────────────────────────────────────────── */
// Not i18n keys: these are literal Dutch words emitted by a formatter, the same way
// formatEUR emits '€' and ',' — packages/shared has no i18next runtime to key into
// (see docs/DECISIONS.md, 2026-09-03 — speech/period-label words).
const WORDS_NL = {
  euro: 'euro',
  cent: 'cent',
  and: 'en',
  negativePrefix: 'min',
} as const;

/* ── Implementation ───────────────────────────────────── */

/**
 * Renders an amount as spoken Dutch for accessibility/voice contexts: `412 euro`,
 * `412 euro en 50 cent`, `min 42 euro`. `euro` and `cent` are invariant (Dutch does not
 * pluralise them here); negative amounts are prefixed with the word `min`, never a
 * minus glyph, since this text is meant to be read aloud.
 */
export function formatMoneyForSpeech(amount: Cents): string {
  const isNegative = amount < 0;
  const absoluteCents = Math.abs(amount);
  const euros = Math.floor(absoluteCents / LIMITS.centsPerEuro);
  const remainderCents = absoluteCents % LIMITS.centsPerEuro;

  const magnitude =
    remainderCents === 0
      ? `${euros} ${WORDS_NL.euro}`
      : `${euros} ${WORDS_NL.euro} ${WORDS_NL.and} ${remainderCents} ${WORDS_NL.cent}`;

  return isNegative ? `${WORDS_NL.negativePrefix} ${magnitude}` : magnitude;
}
