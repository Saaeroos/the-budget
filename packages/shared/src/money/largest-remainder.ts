import { cents, sum } from './core';
import type { Cents } from './types';

/* ── Types ────────────────────────────────────────────── */
export interface WeightedShare<T> {
  readonly id: T;
  /** The share's ideal, possibly-fractional value in cents (e.g. `amount * incomeShare / totalIncome`). */
  readonly value: number;
}

/* ── Implementation ───────────────────────────────────── */

/**
 * Distributes `total` cents across `shares` in proportion to each share's ideal `value`,
 * guaranteeing the results sum to exactly `total` — the largest-remainder method
 * (`docs/10` §7). Naive per-entry rounding loses or invents cents; this never does.
 *
 * Ties in the fractional remainder are broken by original array order, so the result is
 * deterministic for identical input.
 */
export function largestRemainder<T>(shares: readonly WeightedShare<T>[], total: Cents): Map<T, Cents> {
  if (shares.length === 0) return new Map();

  const floors = shares.map((share) => Math.floor(share.value));
  const remainders = shares.map((share, index) => ({ index, fraction: share.value - floors[index]! }));
  const centsToDistribute = total - sum(floors.map((f) => cents(f)));

  const ranked = [...remainders].sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  const bonusIndices = new Set(ranked.slice(0, Math.max(0, centsToDistribute)).map((r) => r.index));

  const result = new Map<T, Cents>();
  shares.forEach((share, index) => {
    const bonus = bonusIndices.has(index) ? 1 : 0;
    result.set(share.id, cents(floors[index]! + bonus));
  });
  return result;
}
