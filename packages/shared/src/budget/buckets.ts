import { add, cents, sub, type Cents } from '../money';
import { BUCKET_GROUP, BUCKET_ORDER, type BucketGroup, type BucketTotals, type BudgetLine } from './types';

/* ── Types ────────────────────────────────────────────── */
// (BucketTotals, BudgetLine live in ./types)

/* ── Implementation ───────────────────────────────────── */

function isBucketGroup(group: BudgetLine['group']): group is BucketGroup {
  return (BUCKET_ORDER as readonly string[]).includes(group);
}

function sumField(lines: readonly BudgetLine[], field: 'plannedCents' | 'carriedInCents' | 'actualCents'): Cents {
  return lines.reduce((total, line) => add(total, line[field]), cents(0));
}

/**
 * Aggregates budget lines into the four fixed buckets, in the fixed display order
 * (`docs/10` §2). Lines whose group is `inkomen` or `overboeking` are never included,
 * even if present in the input — buckets are never set directly (`docs/06` I-9).
 */
export function aggregateBuckets(lines: readonly BudgetLine[]): readonly BucketTotals[] {
  return BUCKET_ORDER.map((group) => {
    const groupLines = lines.filter((line) => isBucketGroup(line.group) && line.group === group);
    const plannedCents = sumField(groupLines, 'plannedCents');
    const carriedInCents = sumField(groupLines, 'carriedInCents');
    const actualCents = sumField(groupLines, 'actualCents');
    const remainingCents = cents(Math.max(0, add(plannedCents, carriedInCents) - actualCents));
    const overCents = cents(Math.max(0, sub(actualCents, add(plannedCents, carriedInCents))));
    return { group: group as BucketGroup, plannedCents, carriedInCents, actualCents, remainingCents, overCents };
  });
}

export { BUCKET_GROUP, BUCKET_ORDER };
