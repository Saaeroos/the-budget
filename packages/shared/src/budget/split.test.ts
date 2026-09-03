import { describe, expect, it } from 'vitest';
import { cents } from '../money';
import { splitByIncome, type IncomeMember } from './split';

describe('splitByIncome', () => {
  it('splits €100 across 3 equal-income members as 33.34 / 33.33 / 33.33 (docs/10 §11)', () => {
    const members: IncomeMember<string>[] = [
      { id: 'a', netMonthlyIncomeCents: cents(300_000) },
      { id: 'b', netMonthlyIncomeCents: cents(300_000) },
      { id: 'c', netMonthlyIncomeCents: cents(300_000) },
    ];
    const result = splitByIncome(cents(10_000), members);
    expect(result.get('a')).toBe(3334);
    expect(result.get('b')).toBe(3333);
    expect(result.get('c')).toBe(3333);
  });

  it('splits in proportion to income for unequal incomes, summing to exactly the amount', () => {
    const members: IncomeMember<string>[] = [
      { id: 'bram', netMonthlyIncomeCents: cents(300_000) },
      { id: 'fleur', netMonthlyIncomeCents: cents(200_000) },
    ];
    const result = splitByIncome(cents(100_000), members);
    expect(result.get('bram')).toBe(60_000);
    expect(result.get('fleur')).toBe(40_000);
  });

  it('falls back to an equal split when total income is 0 (docs/10 §11)', () => {
    const members: IncomeMember<string>[] = [
      { id: 'a', netMonthlyIncomeCents: cents(0) },
      { id: 'b', netMonthlyIncomeCents: cents(0) },
    ];
    const result = splitByIncome(cents(10_000), members);
    expect(result.get('a')).toBe(5000);
    expect(result.get('b')).toBe(5000);
  });

  it('gives a zero-income member a €0 share via the proportional formula when others do earn (docs/10 §11)', () => {
    const members: IncomeMember<string>[] = [
      { id: 'earner', netMonthlyIncomeCents: cents(400_000) },
      { id: 'zero', netMonthlyIncomeCents: cents(0) },
    ];
    // total income is non-zero here (400000), so this exercises the proportional branch
    // with a zero-income member getting a 0 share, not the equal-split fallback.
    const result = splitByIncome(cents(10_000), members);
    expect(result.get('earner')).toBe(10_000);
    expect(result.get('zero')).toBe(0);
  });
});
