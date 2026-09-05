import { cents, type Cents } from '../money';
import type { ExpenseCategoryKind, ExpenseTaxCalculation, MixedExpenseRule } from './types';

/* ── Constants & Text ─────────────────────────────────── */
export const MIXED_EXPENSES_TEXT = {
  horecaBtwExclusion: 'tax.mixed: horeca food & drinks have 0% deductible VAT (art. 15 lid 5 Wet OB)',
  horecaIncomeTaxLimit: 'tax.mixed: horeca expenses are 80% deductible for income tax (art. 3.15 Wet IB)',
} as const;

/** Standard statutory deduction percentage for representation and dining */
export const HORECA_DEDUCTIBLE_RATE_BPS = 8000; // 80%

/* ── Pure Functions ───────────────────────────────────── */

/**
 * Returns default fiscal rules for an expense category.
 */
export function getDefaultExpenseRule(categoryKind: ExpenseCategoryKind): MixedExpenseRule {
  switch (categoryKind) {
    case 'horeca':
      return {
        categoryKind: 'horeca',
        incomeTaxDeductiblePercent: 80,
        btwDeductiblePercent: 0, // 0% under art. 15 lid 5 Wet OB
      };
    case 'telecom':
      return {
        categoryKind: 'telecom',
        incomeTaxDeductiblePercent: 50, // Typical 50/50 split for mixed home/business phone
        btwDeductiblePercent: 50,
      };
    case 'workspace':
      return {
        categoryKind: 'workspace',
        incomeTaxDeductiblePercent: 0, // Generally not deductible under strict Dutch criteria
        btwDeductiblePercent: 0,
      };
    case 'standard':
    default:
      return {
        categoryKind: 'standard',
        incomeTaxDeductiblePercent: 100,
        btwDeductiblePercent: 100,
      };
  }
}

/**
 * Calculates deductible amounts for an expense based on fiscal rules.
 */
export function calculateExpenseTaxImpact(
  amountCents: Cents,
  btwAmountCents: Cents,
  rule: MixedExpenseRule,
): ExpenseTaxCalculation {
  const isHoreca = rule.categoryKind === 'horeca';

  // Apply income tax deductible rate
  const safeIncomeTaxRate = Math.max(0, Math.min(100, rule.incomeTaxDeductiblePercent)) / 100;
  const deductibleAmountCents = cents(Math.round(amountCents * safeIncomeTaxRate));
  const nonDeductibleAmountCents = cents(Math.max(0, amountCents - deductibleAmountCents));

  // Apply BTW deductible rate (0% for horeca)
  const safeBtwRate = isHoreca
    ? 0
    : Math.max(0, Math.min(100, rule.btwDeductiblePercent)) / 100;
  const deductibleBtwCents = cents(Math.round(btwAmountCents * safeBtwRate));

  return {
    originalAmountCents: amountCents,
    deductibleAmountCents,
    deductibleBtwCents,
    nonDeductibleAmountCents,
    isHorecaRestricted: isHoreca,
  };
}
