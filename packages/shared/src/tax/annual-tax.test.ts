import { describe, expect, it } from 'vitest';
import { cents } from '../money';
import { nlDate } from '../dates';
import {
  computeAnnualProfit,
  computeAnnualTaxReturn,
  computeBox1Tax,
  computeBox3Tax,
  computeZzpDeductions,
} from './annual-tax';
import { TAX_PARAMS_2026 } from './tax-parameters';
import type { BusinessTransaction } from './types';

describe('computeAnnualProfit', () => {
  it('aggregates gross income and deductible expenses for given year', () => {
    const txs: readonly BusinessTransaction[] = [
      {
        id: '1',
        amountCents: cents(605000), // € 5.000 omzet, € 1.050 BTW
        btwRate: 21,
        btwAmountCents: cents(105000),
        direction: 'in',
        bookedAt: nlDate('2026-03-01'),
      },
      {
        id: '2',
        amountCents: cents(-121000), // € 1.000 kosten, € 210 BTW
        btwRate: 21,
        btwAmountCents: cents(21000),
        direction: 'out',
        bookedAt: nlDate('2026-04-10'),
        isTaxDeductible: true,
      },
      {
        id: 'old',
        amountCents: cents(300000),
        direction: 'in',
        bookedAt: nlDate('2025-12-31'),
      },
    ];

    const result = computeAnnualProfit(txs, 2026);
    expect(result.grossIncomeCents).toBe(500000); // € 5.000
    expect(result.deductibleExpensesCents).toBe(100000); // € 1.000
    expect(result.profitCents).toBe(400000); // € 4.000
  });
});

describe('computeZzpDeductions', () => {
  it('calculates full zelfstandigenaftrek and MKB-winstvrijstelling for 2026', () => {
    // Profit: € 50.000 (5.000.000 cents)
    const profit = cents(5000000);
    const deductions = computeZzpDeductions(
      profit,
      { isStarter: false, meetsHourCriterion: true },
      TAX_PARAMS_2026,
    );

    // Zelfstandigenaftrek 2026: € 5.030 (503.000 cents)
    expect(deductions.zelfstandigenaftrekCents).toBe(503000);
    expect(deductions.startersaftrekCents).toBe(0);

    // Profit after zelfstandigenaftrek: 50.000 - 5.030 = 44.970 (4.497.000 cents)
    // MKB-winstvrijstelling: 12.7% of 44.970 = 5.711,19 -> 5.711 (571.119 cents)
    expect(deductions.mkbVrijstellingCents).toBe(571119);
    expect(deductions.totalDeductionsCents).toBe(503000 + 571119);
  });

  it('includes startersaftrek when eligible', () => {
    const profit = cents(5000000);
    const deductions = computeZzpDeductions(
      profit,
      { isStarter: true, meetsHourCriterion: true },
      TAX_PARAMS_2026,
    );

    expect(deductions.zelfstandigenaftrekCents).toBe(503000);
    expect(deductions.startersaftrekCents).toBe(212300); // € 2.123
  });

  it('no entrepreneur deductions if hour criterion not met', () => {
    const profit = cents(5000000);
    const deductions = computeZzpDeductions(
      profit,
      { isStarter: true, meetsHourCriterion: false },
      TAX_PARAMS_2026,
    );

    expect(deductions.zelfstandigenaftrekCents).toBe(0);
    expect(deductions.startersaftrekCents).toBe(0);
    // Still receives MKB-winstvrijstelling
    expect(deductions.mkbVrijstellingCents).toBe(Math.round(5000000 * 0.127));
  });
});

describe('computeBox1Tax and computeBox3Tax', () => {
  it('computes progressive Box 1 tax', () => {
    const taxable = cents(3000000); // € 30.000
    const tax = computeBox1Tax(taxable, TAX_PARAMS_2026);
    expect(tax.box1GrossTaxCents).toBeGreaterThan(0);
    expect(tax.heffingskortingenCents).toBeGreaterThan(0);
    expect(tax.netBox1TaxCents).toBeGreaterThanOrEqual(0);
  });

  it('computes Box 3 wealth tax with exemption', () => {
    // Assets € 70.000, Debts € 0, Exemption € 57.000
    // Taxable base = € 13.000 (1.300.000 cents)
    const box3 = computeBox3Tax(cents(7000000), cents(0), TAX_PARAMS_2026);
    expect(box3.taxableBaseCents).toBe(1300000);
    expect(box3.estimatedTaxCents).toBe(Math.round(1300000 * 0.0197));
  });
});

describe('computeAnnualTaxReturn', () => {
  it('assembles complete annual tax projection', () => {
    const txs: readonly BusinessTransaction[] = [
      {
        id: '1',
        amountCents: cents(6050000), // € 50.000 omzet, € 10.500 BTW
        btwRate: 21,
        btwAmountCents: cents(1050000),
        direction: 'in',
        bookedAt: nlDate('2026-06-01'),
      },
    ];

    const result = computeAnnualTaxReturn(txs, {
      year: 2026,
      config: { isStarter: true, meetsHourCriterion: true, box3AssetsCents: cents(6000000) },
      status: 'in_progress',
      params: TAX_PARAMS_2026,
    });

    expect(result.year).toBe(2026);
    expect(result.grossIncomeCents).toBe(5000000);
    expect(result.profitCents).toBe(5000000);
    expect(result.deductions.zelfstandigenaftrekCents).toBe(503000);
    expect(result.deductions.startersaftrekCents).toBe(212300);
    expect(result.box3?.taxableBaseCents).toBe(300000); // 60.000 - 57.000 = 3.000
    expect(result.totalTaxDueCents).toBeGreaterThan(0);
  });
});
