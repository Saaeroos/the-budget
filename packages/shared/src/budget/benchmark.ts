import { sub, type Cents } from '../money';

/* ── Types ────────────────────────────────────────────── */
/**
 * The already-resolved Nibud reference row for a household composition/income band/category.
 * The lookup itself (`docs/06` §9's `nibud_reference` table) is I/O and lives outside
 * `packages/shared` — this function only compares an actual against an already-fetched
 * reference (docs/DECISIONS.md, 2026-09-03 — benchmark reference lookup).
 */
export interface NibudReference {
  readonly amountCents: Cents;
  readonly sourceNote: string;
}

export interface Benchmark {
  readonly reference: Cents;
  readonly delta: Cents;
  readonly ratio: number;
  readonly source: string;
}

/* ── Implementation ───────────────────────────────────── */

/**
 * Compares an actual spend to the Nibud reference for its category, or `null` when no
 * reference exists (`docs/10` §8). Presentation is always neutral — no "too much", no
 * colour judgement, no score; that rule lives in the UI layer, not here.
 */
export function benchmark(actual: Cents, reference: NibudReference | null): Benchmark | null {
  if (reference == null) return null;
  return {
    reference: reference.amountCents,
    delta: sub(actual, reference.amountCents),
    ratio: actual / reference.amountCents,
    source: reference.sourceNote,
  };
}
