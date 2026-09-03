/* ── Types ────────────────────────────────────────────── */
export interface TrtpFields {
  readonly name: string | null;
  readonly memo: string | null;
}

/* ── Implementation ───────────────────────────────────── */

// `docs/09` §2 step 2's known-prefix patterns. `Betaalpas` is added alongside the
// documented BEA/GEA/SEPA/… list — a real, extremely common NL card-payment prefix the
// doc's own worked example ("BEA, Betaalpas ALBERT HEIJN…") requires stripping but the
// literal regex list omits (docs/DECISIONS.md, 2026-09-03 — normalisation prefix fixes).
const GENERIC_PREFIX_PATTERNS: readonly RegExp[] = [
  /^(BEA|GEA|SEPA|BETAALAUTOMAAT|IDEAL|WERO|Betaalpas)[,: ]*/i,
  /^(SEPA\s+)?(Incasso|Overboeking|iDEAL|Periodieke overb\.?)\b\s*/i,
];

const TRTP_PREFIX_PATTERN = /^\/TRTP\/.*?\//;

// Tikkie's "Tikkie ID <n>" prefix is not in `docs/09` §2's literal pattern list, but the
// worked example ("Tikkie ID 1234 Fleur - pizza vrijdag") requires it, and `docs/09` §5.4
// already treats Tikkie as its own recognised descriptor family (docs/DECISIONS.md,
// 2026-09-03 — normalisation prefix fixes).
const TIKKIE_PREFIX_PATTERN = /^Tikkie(?:\s+ID)?\s+\d+\s*/i;

/** Repeatedly strips BEA/SEPA/Incasso/… prefixes until none match (`docs/09` §2 step 2). */
export function stripGenericPrefixes(text: string): string {
  let current = text;
  let strippedSomething = true;
  while (strippedSomething) {
    strippedSomething = false;
    for (const pattern of GENERIC_PREFIX_PATTERNS) {
      const match = current.match(pattern);
      if (match != null && match[0].length > 0) {
        current = current.slice(match[0].length);
        strippedSomething = true;
      }
    }
  }
  return current;
}

/** Strips ABN AMRO's `/TRTP/.../` structured prefix, returning what follows it. */
export function stripTrtpPrefix(text: string): string | null {
  const match = text.match(TRTP_PREFIX_PATTERN);
  return match == null ? null : text.slice(match[0].length);
}

/**
 * Parses a TRTP remainder's `/TAG/value/TAG/value/…` segments (`docs/09` §2's `/TRTP/`
 * example isn't otherwise explained by the doc's colon-based field rules — this is the
 * slash-delimited analogue, extracting `NAME` as the counterparty name and `REMI` as the
 * remittance memo; other tags, e.g. `IBAN`, are noise).
 */
export function parseTrtpFields(remainder: string): TrtpFields {
  const parts = remainder.split('/');
  let name: string | null = null;
  let memo: string | null = null;
  for (let i = 0; i + 1 < parts.length; i += 2) {
    // Non-null: the loop bound guarantees both parts[i] and parts[i + 1] are in range.
    const tag = parts[i]!.toUpperCase();
    const value = parts[i + 1]!.trim();
    if (tag === 'NAME') name = value;
    if (tag === 'REMI') memo = value;
  }
  return { name, memo };
}

/** Strips a Tikkie payment-request prefix ("Tikkie ID 1234 "), if present. */
export function stripTikkiePrefix(text: string): string | null {
  const match = text.match(TIKKIE_PREFIX_PATTERN);
  return match == null ? null : text.slice(match[0].length);
}
