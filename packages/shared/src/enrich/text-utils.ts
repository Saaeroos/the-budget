/* ── Types ────────────────────────────────────────────── */
// (none)

/* ── Implementation ───────────────────────────────────── */

// `docs/09` §2 step 3's non-labelled noise tokens (the label-prefixed ones — IBAN:, BIC:,
// KENMERK:, MACHTIGING:, NR: — are handled by the label tokenizer instead; see
// tokenize-labels.ts).
const CARD_REFERENCE_PATTERN = /PAS\d{2,4}/gi;
const DATE_PATTERN = /\b\d{2}[-/]\d{2}[-/]\d{2,4}\b/g;
const TIME_PATTERN = /\b\d{2}:\d{2}\b/g;
const ALL_DIGITS_PATTERN = /^\d{6,}$/;
const TRAILING_PUNCTUATION_PATTERN = /[.,;:]+$/;
const LEADING_WORDS_PATTERN = /^([\p{L}.&'-]+(?:\s+[\p{L}.&'-]+)*)/u;

/** Removes unlabelled noise tokens: card reference numbers, dates and times. */
export function removeUnlabeledNoise(text: string): string {
  return text.replace(CARD_REFERENCE_PATTERN, '').replace(DATE_PATTERN, '').replace(TIME_PATTERN, '').replace(ALL_DIGITS_PATTERN, '');
}

/** Collapses runs of whitespace, trims, and drops trailing punctuation (`docs/09` §2 step 5). */
export function collapseAndTrim(text: string): string {
  return text.replace(/\s+/g, ' ').trim().replace(TRAILING_PUNCTUATION_PATTERN, '');
}

// No empty-segment guard: `words` is always `deriveCounterpartyFromLeadingWords`'s matched
// text, which is itself always called on a `collapseAndTrim`-ed string upstream (see
// normalize-description.ts) — so `words` never contains a run of 2+ spaces, and
// `.split(' ')` can never produce an empty segment here (docs/DECISIONS.md, 2026-09-03 —
// enrich unreachable-branch simplifications).
function titleCase(words: string): string {
  return words
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * When no structured `Naam:`/`NAME` field exists, derives a counterparty name from the
 * leading run of word-like tokens before the first digit-leading token (e.g. a store
 * number) — `"ALBERT HEIJN 1234 DEN HAAG"` → `"Albert Heijn"`. Returns `null` when no
 * such leading run exists.
 */
export function deriveCounterpartyFromLeadingWords(text: string): string | null {
  const match = text.match(LEADING_WORDS_PATTERN);
  const words = match?.[1]?.trim();
  return words != null && words.length > 0 ? titleCase(words) : null;
}
