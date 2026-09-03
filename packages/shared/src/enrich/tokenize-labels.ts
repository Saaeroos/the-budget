/* ── Types ────────────────────────────────────────────── */
export interface LabeledFields {
  /** The text preceding the first recognised label, if any (or the whole text, if none). */
  readonly leading: string;
  readonly name: string | null;
  readonly memo: string | null;
}

/* ── Implementation ───────────────────────────────────── */

// `docs/09` §2 step 4 gives per-field lookahead regexes (`Naam:`, `Omschrijving:`,
// `Incassant(?:ID)?:`) that, applied literally, fail on the doc's own worked example
// (the `Naam:` lookahead never includes `Machtiging` as a stop word, so it can never
// terminate before end-of-string in "Naam: Zilveren Kruis Machtiging: 123"). A single
// label tokenizer — find every known `Label:` occurrence, then each field's value is the
// text up to the next label — is more robust and produces the same documented outcomes
// (docs/DECISIONS.md, 2026-09-03 — structured-field tokenizer). `IncassantID` must be
// tried before `Incassant` in the alternation, or the shorter alternative wins first.
const LABEL_PATTERN = /\b(IncassantID|Incassant|Naam|Omschrijving|Kenmerk|Machtiging|IBAN|BIC|NR):\s*/gi;

function canonicalLabel(rawLabel: string): string {
  return rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1).toLowerCase();
}

/**
 * Extracts every `Label: value` field from `text` (`docs/09` §2 step 4), returning the
 * `Naam:` value as `name`, the `Omschrijving:` value as `memo`, and the unlabelled text
 * before the first label as `leading`. Other labels (`Incassant`, `Kenmerk`,
 * `Machtiging`, `IBAN`, `BIC`, `NR`) are recognised (so their values are excluded from
 * `leading`) but not returned — they are noise for `description_clean` purposes.
 */
export function extractLabeledFields(text: string): LabeledFields {
  const matches = [...text.matchAll(LABEL_PATTERN)];
  if (matches.length === 0) return { leading: text, name: null, memo: null };

  const firstMatch = matches[0]!;
  const leading = text.slice(0, firstMatch.index);

  let name: string | null = null;
  let memo: string | null = null;
  matches.forEach((match, index) => {
    const label = canonicalLabel(match[1]!);
    const valueStart = match.index + match[0].length;
    const valueEnd = matches[index + 1]?.index ?? text.length;
    const value = text.slice(valueStart, valueEnd).trim();
    if (label === 'Naam') name = value;
    if (label === 'Omschrijving') memo = value;
  });

  return { leading, name, memo };
}
