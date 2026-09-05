import { describe, expect, it } from 'vitest';
import { cents } from '../money';
import { nlDate } from '../dates';
import {
  computeAnnualDepreciation,
  computeKiaDeduction,
  computeTotalDepreciationForYear,
  generateDepreciationSchedule,
  isAssetInvestment,
} from './assets';
import type { BusinessAsset } from './types';

describe('asset & depreciation engine', () => {
  it('correctly identifies purchases exceeding €450 excl. BTW as asset investments', () => {
    expect(isAssetInvestment(cents(45000))).toBe(false); // €450 exact is expensed directly
    expect(isAssetInvestment(cents(45001))).toBe(true);  // €450,01 must be capitalized
    expect(isAssetInvestment(cents(180000))).toBe(true); // MacBook €1.800
    expect(isAssetInvestment(cents(15000))).toBe(false); // Mouse €150
  });

  it('computes linear depreciation with pro-rata month allocation', () => {
    // MacBook purchased on 2026-07-01 for €1.800 excl. BTW, residual €200, 60 months (5 years)
    // Depreciable base = 1800 - 200 = 1600 euros = 160,000 cents.
    // Monthly rate = 160,000 / 60 = 2666.67 cents/mo
    // In 2026 (July-Dec = 6 months): 6 * 2666.67 = 16,000 cents (€160)
    // In 2027 (12 months): 12 * 2666.67 = 32,000 cents (€320)
    const macbook: BusinessAsset = {
      id: 'asset-macbook',
      name: 'MacBook Pro 16"',
      category: 'hardware',
      purchaseDate: nlDate('2026-07-01'),
      purchaseCostCents: cents(180000),
      residualValueCents: cents(20000),
      lifespanMonths: 60,
      btwRate: 21,
      btwAmountCents: cents(37800),
      isKiaEligible: true,
    };

    expect(computeAnnualDepreciation(macbook, 2025)).toBe(cents(0)); // Prior to purchase
    expect(computeAnnualDepreciation(macbook, 2026)).toBe(cents(16000)); // 6 months in 2026
    expect(computeAnnualDepreciation(macbook, 2027)).toBe(cents(32000)); // Full year in 2027
    expect(computeAnnualDepreciation(macbook, 2031)).toBe(cents(16000)); // Remaining 6 months in 2031
    expect(computeAnnualDepreciation(macbook, 2032)).toBe(cents(0)); // Finished
  });

  it('generates multi-year depreciation schedule', () => {
    const phone: BusinessAsset = {
      id: 'asset-phone',
      name: 'iPhone 17 Pro',
      category: 'phone',
      purchaseDate: nlDate('2026-01-01'),
      purchaseCostCents: cents(120000),
      residualValueCents: cents(0),
      lifespanMonths: 36, // 3 years
      btwRate: 21,
      btwAmountCents: cents(25200),
      isKiaEligible: true,
    };

    const schedule = generateDepreciationSchedule(phone, 2026);
    expect(schedule.annualDepreciationCents).toBe(cents(40000)); // €400/yr
    expect(schedule.currentYearDepreciationCents).toBe(cents(40000));
    expect(schedule.years.length).toBeGreaterThanOrEqual(3);
    expect(schedule.years[0]?.remainingBookValueCents).toBe(cents(80000));
    expect(schedule.years[1]?.remainingBookValueCents).toBe(cents(40000));
    expect(schedule.years[2]?.remainingBookValueCents).toBe(cents(0));
  });

  it('calculates total depreciation across assets for a year', () => {
    const assets: BusinessAsset[] = [
      {
        id: '1',
        name: 'Desk',
        category: 'furniture',
        purchaseDate: nlDate('2026-01-01'),
        purchaseCostCents: cents(60000),
        residualValueCents: cents(0),
        lifespanMonths: 60, // 100/mo -> 1200/yr in 2026
        btwRate: 21,
        btwAmountCents: cents(12600),
        isKiaEligible: true,
      },
      {
        id: '2',
        name: 'Monitor',
        category: 'hardware',
        purchaseDate: nlDate('2026-01-01'),
        purchaseCostCents: cents(60000),
        residualValueCents: cents(0),
        lifespanMonths: 60, // 100/mo -> 1200/yr in 2026
        btwRate: 21,
        btwAmountCents: cents(12600),
        isKiaEligible: true,
      },
    ];

    expect(computeTotalDepreciationForYear(assets, 2026)).toBe(cents(24000));
  });

  it('computes Dutch KIA deduction brackets according to Belastingdienst thresholds', () => {
    // Under €2.801 threshold -> €0
    expect(computeKiaDeduction(cents(200000))).toBe(cents(0));

    // In tier 1 (€2.801 - €69.764) -> 28%
    // €10.000 investment -> €2.800 KIA deduction
    expect(computeKiaDeduction(cents(1000000))).toBe(cents(280000));

    // In tier 2 (€69.765 - €129.213) -> fixed €19.534
    expect(computeKiaDeduction(cents(10000000))).toBe(cents(1953400));
  });
});
