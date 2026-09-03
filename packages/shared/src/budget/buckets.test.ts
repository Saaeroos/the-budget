import { describe, expect, it } from 'vitest';
import { cents } from '../money';
import { aggregateBuckets } from './buckets';
import { CATEGORY_GROUP, ROLLOVER_MODE, type BudgetLine } from './types';

function line(group: BudgetLine['group'], plannedCents: number, carriedInCents: number, actualCents: number): BudgetLine {
  return {
    group,
    plannedCents: cents(plannedCents),
    carriedInCents: cents(carriedInCents),
    actualCents: cents(actualCents),
    rolloverMode: ROLLOVER_MODE.none,
  };
}

describe('aggregateBuckets', () => {
  it('returns the four buckets in the fixed display order, even with no lines', () => {
    const totals = aggregateBuckets([]);
    expect(totals.map((t) => t.group)).toEqual(['vaste_lasten', 'reserveringen', 'huishoudelijk', 'vrij_besteedbaar']);
    expect(totals.every((t) => t.plannedCents === 0 && t.remainingCents === 0 && t.overCents === 0)).toBe(true);
  });

  it('sums planned, carried-in and actual per group', () => {
    const totals = aggregateBuckets([
      line(CATEGORY_GROUP.fixed, 100_000, 0, 80_000),
      line(CATEGORY_GROUP.fixed, 20_000, 0, 20_000),
    ]);
    const fixed = totals.find((t) => t.group === CATEGORY_GROUP.fixed)!;
    expect(fixed.plannedCents).toBe(120_000);
    expect(fixed.actualCents).toBe(100_000);
    expect(fixed.remainingCents).toBe(20_000);
    expect(fixed.overCents).toBe(0);
  });

  it('floors remaining at 0 when actual exceeds planned, and reports the overage separately', () => {
    const totals = aggregateBuckets([line(CATEGORY_GROUP.household, 10_000, 0, 15_000)]);
    const household = totals.find((t) => t.group === CATEGORY_GROUP.household)!;
    expect(household.remainingCents).toBe(0);
    expect(household.overCents).toBe(5000);
  });

  it('includes carried-in amounts in both remaining and over calculations', () => {
    const totals = aggregateBuckets([line(CATEGORY_GROUP.reserved, 10_000, 5000, 12_000)]);
    const reserved = totals.find((t) => t.group === CATEGORY_GROUP.reserved)!;
    expect(reserved.remainingCents).toBe(3000);
    expect(reserved.overCents).toBe(0);
  });

  it('never includes inkomen or overboeking lines in any bucket total', () => {
    const totals = aggregateBuckets([line(CATEGORY_GROUP.income, 500_000, 0, 500_000), line(CATEGORY_GROUP.transfer, 1000, 0, 1000)]);
    expect(totals.every((t) => t.plannedCents === 0 && t.actualCents === 0)).toBe(true);
  });
});
