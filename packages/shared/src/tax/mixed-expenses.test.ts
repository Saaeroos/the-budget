import { describe, expect, it } from 'vitest';
import { cents } from '../money';
import {
  calculateExpenseTaxImpact,
  getDefaultExpenseRule,
  HORECA_DEDUCTIBLE_RATE_BPS,
} from './mixed-expenses';

describe('mixed expenses engine', () => {
  it('enforces 0% BTW and 80% income tax deduction on horeca / dining', () => {
    const rule = getDefaultExpenseRule('horeca');
    expect(rule.btwDeductiblePercent).toBe(0);
    expect(rule.incomeTaxDeductiblePercent).toBe(80);
    expect(HORECA_DEDUCTIBLE_RATE_BPS).toBe(8000);

    // Bill of €100 excl. BTW, €9 BTW (total €109)
    const result = calculateExpenseTaxImpact(cents(10000), cents(900), rule);
    expect(result.isHorecaRestricted).toBe(true);
    // 80% of €100 = €80
    expect(result.deductibleAmountCents).toBe(cents(8000));
    expect(result.nonDeductibleAmountCents).toBe(cents(2000));
    // 0% BTW deduction under art. 15 lid 5 Wet OB
    expect(result.deductibleBtwCents).toBe(cents(0));
  });

  it('correctly calculates 50/50 split on telecom / phone subscriptions', () => {
    const rule = getDefaultExpenseRule('telecom');
    // KPN bill of €60 excl. BTW, €12.60 BTW
    const result = calculateExpenseTaxImpact(cents(6000), cents(1260), rule);
    expect(result.isHorecaRestricted).toBe(false);
    expect(result.deductibleAmountCents).toBe(cents(3000));
    expect(result.deductibleBtwCents).toBe(cents(630));
  });

  it('allows 100% deduction on standard business expenses', () => {
    const rule = getDefaultExpenseRule('standard');
    const result = calculateExpenseTaxImpact(cents(5000), cents(1050), rule);
    expect(result.deductibleAmountCents).toBe(cents(5000));
    expect(result.deductibleBtwCents).toBe(cents(1050));
    expect(result.nonDeductibleAmountCents).toBe(cents(0));
  });
});
