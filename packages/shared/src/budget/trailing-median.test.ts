import { describe, expect, it } from 'vitest';
import { nlDate } from '../dates';
import { cents } from '../money';
import { trailingMedianDailySpend, type SpendTransaction, type TrailingWindow } from './trailing-median';
import { CATEGORY_GROUP, TXN_DIRECTION } from './types';

function txn(overrides: Partial<SpendTransaction>): SpendTransaction {
  return {
    bookedAt: nlDate('2026-03-01'),
    direction: TXN_DIRECTION.out,
    categoryGroup: CATEGORY_GROUP.household,
    amountCents: cents(0),
    isTransfer: false,
    isExcluded: false,
    ...overrides,
  };
}

describe('trailingMedianDailySpend', () => {
  it('is 0 over an all-zero window', () => {
    const window: TrailingWindow = { endsOn: nlDate('2026-03-10'), days: 5 };
    expect(trailingMedianDailySpend([], window, CATEGORY_GROUP.household)).toBe(0);
  });

  it('counts zero-spend days in the population, not just days with a transaction', () => {
    // Only 1 of 5 days has spend (2000); the median of [0,0,0,0,2000] is 0.
    const window: TrailingWindow = { endsOn: nlDate('2026-03-05'), days: 5 };
    const transactions = [txn({ bookedAt: nlDate('2026-03-05'), amountCents: cents(2000) })];
    expect(trailingMedianDailySpend(transactions, window, CATEGORY_GROUP.household)).toBe(0);
  });

  it('sums same-day transactions before ranking', () => {
    const window: TrailingWindow = { endsOn: nlDate('2026-03-05'), days: 3 };
    const transactions = [
      txn({ bookedAt: nlDate('2026-03-05'), amountCents: cents(500) }),
      txn({ bookedAt: nlDate('2026-03-05'), amountCents: cents(500) }),
    ];
    // days: 03-03=0, 03-04=0, 03-05=1000 -> median of [0,0,1000] is 0.
    expect(trailingMedianDailySpend(transactions, window, CATEGORY_GROUP.household)).toBe(0);
  });

  it('takes the average of the two middle values for an even-sized population', () => {
    const window: TrailingWindow = { endsOn: nlDate('2026-03-04'), days: 4 };
    const transactions = [
      txn({ bookedAt: nlDate('2026-03-03'), amountCents: cents(1000) }),
      txn({ bookedAt: nlDate('2026-03-04'), amountCents: cents(2000) }),
    ];
    // sorted: [0, 0, 1000, 2000] -> median of middle two (0, 1000) = 500.
    expect(trailingMedianDailySpend(transactions, window, CATEGORY_GROUP.household)).toBe(500);
  });

  it('excludes an outlier day so it does not poison the median (docs/10 §6)', () => {
    const endsOn = nlDate('2026-04-09'); // 100-day window ending here
    const window: TrailingWindow = { endsOn, days: 100 };
    // 99 ordinary days at 1000, plus one outlier day at 100000.
    const transactions: SpendTransaction[] = [];
    let day = nlDate('2026-01-01');
    for (let i = 0; i < 99; i += 1) {
      transactions.push(txn({ bookedAt: day, amountCents: cents(1000) }));
      day = nlDate(addOneDay(day));
    }
    transactions.push(txn({ bookedAt: endsOn, amountCents: cents(100_000) }));
    // Excluding the top 2% (2 of 100 days) still removes the outlier plus one ordinary
    // day, leaving 98 days all at 1000 -> median 1000, not skewed by the outlier.
    expect(trailingMedianDailySpend(transactions, window, CATEGORY_GROUP.household)).toBe(1000);
  });

  it('ignores income, other groups, transfers and excluded transactions', () => {
    const window: TrailingWindow = { endsOn: nlDate('2026-03-05'), days: 2 };
    const transactions = [
      txn({ bookedAt: nlDate('2026-03-05'), direction: TXN_DIRECTION.in, amountCents: cents(5000) }),
      txn({ bookedAt: nlDate('2026-03-05'), categoryGroup: CATEGORY_GROUP.fixed, amountCents: cents(5000) }),
      txn({ bookedAt: nlDate('2026-03-05'), isTransfer: true, amountCents: cents(5000) }),
      txn({ bookedAt: nlDate('2026-03-05'), isExcluded: true, amountCents: cents(5000) }),
    ];
    expect(trailingMedianDailySpend(transactions, window, CATEGORY_GROUP.household)).toBe(0);
  });

  it('is 0 for a zero-day window (degenerate input), never throwing', () => {
    const window: TrailingWindow = { endsOn: nlDate('2026-03-10'), days: 0 };
    expect(trailingMedianDailySpend([], window, CATEGORY_GROUP.household)).toBe(0);
  });

  it('ignores a transaction booked outside the window', () => {
    const window: TrailingWindow = { endsOn: nlDate('2026-03-05'), days: 2 };
    const transactions = [txn({ bookedAt: nlDate('2026-01-01'), amountCents: cents(5000) })];
    expect(trailingMedianDailySpend(transactions, window, CATEGORY_GROUP.household)).toBe(0);
  });
});

function addOneDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const next = new Date(y, m - 1, d + 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}
