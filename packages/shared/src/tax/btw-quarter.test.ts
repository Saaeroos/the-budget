import { describe, expect, it } from 'vitest';
import { cents } from '../money';
import { nlDate } from '../dates';
import {
  allQuartersForYear,
  computeBtwAangifte,
  daysUntilDeadline,
  isInQuarter,
  quarterByNumber,
  quarterForDate,
} from './btw-quarter';
import type { BusinessTransaction } from './types';

describe('quarterByNumber and quarterForDate', () => {
  it('identifies quarters and deadline correctly for 2026', () => {
    const q1 = quarterForDate(nlDate('2026-02-15'));
    expect(q1.quarter).toBe(1);
    expect(q1.label).toBe('Q1 2026');
    expect(q1.startsOn).toBe('2026-01-01');
    expect(q1.endsOn).toBe('2026-03-31');
    expect(q1.filingDeadline).toBe('2026-04-30');

    const q2 = quarterForDate(nlDate('2026-06-30'));
    expect(q2.quarter).toBe(2);
    expect(q2.filingDeadline).toBe('2026-07-31');

    const q3 = quarterForDate(nlDate('2026-07-01'));
    expect(q3.quarter).toBe(3);
    expect(q3.filingDeadline).toBe('2026-10-31');

    const q4 = quarterForDate(nlDate('2026-12-31'));
    expect(q4.quarter).toBe(4);
    expect(q4.filingDeadline).toBe('2027-01-31');
  });

  it('allQuartersForYear returns 4 quarters', () => {
    const list = allQuartersForYear(2026);
    expect(list).toHaveLength(4);
    expect(list[0]?.label).toBe('Q1 2026');
    expect(list[3]?.label).toBe('Q4 2026');
  });

  it('isInQuarter correctly checks date bounds', () => {
    const q3 = quarterByNumber(2026, 3);
    expect(isInQuarter(nlDate('2026-07-01'), q3)).toBe(true);
    expect(isInQuarter(nlDate('2026-09-30'), q3)).toBe(true);
    expect(isInQuarter(nlDate('2026-06-30'), q3)).toBe(false);
    expect(isInQuarter(nlDate('2026-10-01'), q3)).toBe(false);
  });

  it('daysUntilDeadline computes remaining days', () => {
    const q3 = quarterByNumber(2026, 3);
    // Deadline is 2026-10-31
    expect(daysUntilDeadline(q3, nlDate('2026-10-31'))).toBe(0);
    expect(daysUntilDeadline(q3, nlDate('2026-10-30'))).toBe(1);
    expect(daysUntilDeadline(q3, nlDate('2026-10-01'))).toBe(30);
  });
});

describe('computeBtwAangifte', () => {
  const q3 = quarterByNumber(2026, 3);

  it('maps transactions to rubriek 1a, 1b, 1e, 1f, 5b and 5g', () => {
    const txs: readonly BusinessTransaction[] = [
      // Income invoice 1: € 3.630 incl 21% BTW (€ 3.000 omzet, € 630 BTW)
      {
        id: 'tx-1',
        amountCents: cents(363000),
        btwRate: 21,
        btwAmountCents: cents(63000),
        direction: 'in',
        bookedAt: nlDate('2026-08-10'),
      },
      // Income invoice 2: € 1.090 incl 9% BTW (€ 1.000 omzet, € 90 BTW)
      {
        id: 'tx-2',
        amountCents: cents(109000),
        btwRate: 9,
        btwAmountCents: cents(9000),
        direction: 'in',
        bookedAt: nlDate('2026-09-05'),
      },
      // Expense 1: Hosting € 121 incl 21% BTW (€ 21 deductible BTW)
      {
        id: 'tx-3',
        amountCents: cents(-12100),
        btwRate: 21,
        btwAmountCents: cents(2100),
        direction: 'out',
        bookedAt: nlDate('2026-07-20'),
        isTaxDeductible: true,
      },
      // Expense 2: Software € 60.50 incl 21% BTW (€ 10.50 deductible BTW)
      {
        id: 'tx-4',
        amountCents: cents(-6050),
        btwRate: 21,
        btwAmountCents: cents(1050),
        direction: 'out',
        bookedAt: nlDate('2026-08-15'),
        isTaxDeductible: true,
      },
      // Non-deductible expense: should NOT count towards 5b
      {
        id: 'tx-5',
        amountCents: cents(-5000),
        btwRate: 21,
        btwAmountCents: cents(1050),
        direction: 'out',
        bookedAt: nlDate('2026-08-20'),
        isTaxDeductible: false,
      },
      // Transaction outside Q3: should be ignored
      {
        id: 'tx-old',
        amountCents: cents(242000),
        btwRate: 21,
        btwAmountCents: cents(42000),
        direction: 'in',
        bookedAt: nlDate('2026-05-15'),
      },
    ];

    const aangifte = computeBtwAangifte(txs, q3);

    // Rubriek 1a (omzet 21%): € 3.000 (300.000 cents)
    expect(aangifte.rubrieken.rubriek1aOmzetCents).toBe(300000);
    // Rubriek 1b (BTW 21%): € 630 (63.000 cents)
    expect(aangifte.rubrieken.rubriek1bBtwCents).toBe(63000);

    // Rubriek 1e (omzet 9%): € 1.000 (100.000 cents)
    expect(aangifte.rubrieken.rubriek1eOmzetCents).toBe(100000);
    // Rubriek 1f (BTW 9%): € 90 (9.000 cents)
    expect(aangifte.rubrieken.rubriek1fBtwCents).toBe(9000);

    // Rubriek 5b (voorbelasting): € 21 + € 10.50 = € 31.50 (3.150 cents)
    expect(aangifte.rubrieken.rubriek5bVoorbelastingCents).toBe(3150);

    // Rubriek 5g (subtotaal): (63000 + 9000) - 3150 = 68850 cents (€ 688.50)
    expect(aangifte.rubrieken.rubriek5gSubtotaalCents).toBe(68850);
    expect(aangifte.totalDueCents).toBe(68850);
    expect(aangifte.transactionCount).toBe(5);
  });
});
