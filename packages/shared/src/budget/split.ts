import { largestRemainder, sum, type Cents, type WeightedShare } from '../money';

/* ── Types ────────────────────────────────────────────── */
export interface IncomeMember<Id> {
  readonly id: Id;
  readonly netMonthlyIncomeCents: Cents;
}

/* ── Implementation ───────────────────────────────────── */

function toShares<Id>(members: readonly IncomeMember<Id>[], weight: (m: IncomeMember<Id>) => number): WeightedShare<Id>[] {
  return members.map((m) => ({ id: m.id, value: weight(m) }));
}

/**
 * Splits `amount` across household members "naar draagkracht" (in proportion to net
 * monthly income), falling back to an equal split when total income is 0 (`docs/10` §7).
 * Uses `largestRemainder` throughout so the parts always sum to exactly `amount`.
 */
export function splitByIncome<Id>(amount: Cents, members: readonly IncomeMember<Id>[]): Map<Id, Cents> {
  const totalIncome = sum(members.map((m) => m.netMonthlyIncomeCents));
  const shares =
    totalIncome === 0
      ? toShares(members, () => amount / members.length)
      : toShares(members, (m) => (amount * m.netMonthlyIncomeCents) / totalIncome);
  return largestRemainder(shares, amount);
}
