import { cents, type Cents } from '../money';
import { getTaxParams } from './tax-parameters';
import type {
  AnnualTaxConfig,
  AnnualTaxReturn,
  Box3Snapshot,
  BusinessTransaction,
  FilingStatus,
  TaxParams,
  ZzpDeductions,
} from './types';

/* ── Text ─────────────────────────────────────────────── */
export const ANNUAL_TAX_TEXT = {
  annualSummary: 'tax.annual: {{year}} Annual Tax Summary',
} as const;

/* ── Types ────────────────────────────────────────────── */
// (types defined in ./types)

/* ── Implementation ───────────────────────────────────── */

/**
 * Computes annual gross income, deductible expenses, and preliminary profit
 * for business transactions in a given calendar year.
 */
export function computeAnnualProfit(
  transactions: readonly BusinessTransaction[],
  year: number,
): {
  readonly grossIncomeCents: Cents;
  readonly deductibleExpensesCents: Cents;
  readonly profitCents: Cents;
} {
  const yStr = String(year);
  const yearTxs = transactions.filter((tx) => tx.bookedAt.startsWith(yStr));

  let grossIncome = 0;
  let deductibleExpenses = 0;

  for (const tx of yearTxs) {
    const absAmount = Math.abs(tx.amountCents);
    const btwAmount = tx.btwAmountCents ? Math.abs(tx.btwAmountCents) : 0;
    const amountExclBtw = Math.max(0, absAmount - btwAmount);

    if (tx.direction === 'in') {
      grossIncome += amountExclBtw;
    } else if (tx.direction === 'out') {
      const isDeductible = tx.isTaxDeductible !== false;
      if (isDeductible) {
        deductibleExpenses += amountExclBtw;
      }
    }
  }

  const profit = Math.max(0, grossIncome - deductibleExpenses);

  return {
    grossIncomeCents: cents(grossIncome),
    deductibleExpensesCents: cents(deductibleExpenses),
    profitCents: cents(profit),
  };
}

/**
 * Computes KIA (Kleinschaligheidsinvesteringsaftrek) based on eligible annual business investments.
 */
function computeKia(investmentsCents: Cents | undefined, profitCents: Cents): Cents {
  if (!investmentsCents || investmentsCents < 280100) {
    // Under € 2.801 threshold
    return cents(0);
  }

  let kia = 0;
  if (investmentsCents <= 6976400) {
    // € 2.801 - € 69.764: 28%
    kia = Math.round(investmentsCents * 0.28);
  } else if (investmentsCents <= 12919400) {
    // € 69.764 - € 129.194: fixed € 19.534
    kia = 1953400;
  } else if (investmentsCents <= 38048200) {
    // € 129.194 - € 380.482: € 19.534 minus 7.56% above € 129.194
    const excess = investmentsCents - 12919400;
    kia = Math.max(0, Math.round(1953400 - excess * 0.0756));
  }

  // KIA cannot exceed business profit
  return cents(Math.min(kia, profitCents));
}

/**
 * Computes Dutch ZZP entrepreneur tax deductions:
 * - Zelfstandigenaftrek (requires 1.225 hours)
 * - Startersaftrek (requires starter status + hour criterion)
 * - KIA (investment deduction)
 * - MKB-winstvrijstelling (12,70% over profit after entrepreneur deductions)
 */
export function computeZzpDeductions(
  profitCents: Cents,
  config: AnnualTaxConfig,
  params: TaxParams,
): ZzpDeductions {
  if (profitCents <= 0) {
    return {
      zelfstandigenaftrekCents: cents(0),
      startersaftrekCents: cents(0),
      mkbVrijstellingCents: cents(0),
      kiaCents: cents(0),
      totalDeductionsCents: cents(0),
    };
  }

  let remainingProfit: number = profitCents;

  // 1. Zelfstandigenaftrek (if hour criterion met)
  let zelfstandigenaftrek = 0;
  if (config.meetsHourCriterion) {
    zelfstandigenaftrek = Math.min(remainingProfit, params.zelfstandigenaftrekCents);
    remainingProfit = Math.max(0, remainingProfit - zelfstandigenaftrek);
  }

  // 2. Startersaftrek (if starter and hour criterion met)
  let startersaftrek = 0;
  if (config.meetsHourCriterion && config.isStarter) {
    startersaftrek = Math.min(remainingProfit, params.startersaftrekCents);
    remainingProfit = Math.max(0, remainingProfit - startersaftrek);
  }

  // 3. KIA
  const kia = computeKia(config.investmentsCents, cents(remainingProfit));
  remainingProfit = Math.max(0, remainingProfit - kia);

  // 4. MKB-winstvrijstelling (applied to profit after entrepreneur deductions)
  const mkbRate = params.mkbVrijstellingBps / 10_000;
  const mkbVrijstelling = Math.round(remainingProfit * mkbRate);

  const totalDeductions = zelfstandigenaftrek + startersaftrek + kia + mkbVrijstelling;

  return {
    zelfstandigenaftrekCents: cents(zelfstandigenaftrek),
    startersaftrekCents: cents(startersaftrek),
    mkbVrijstellingCents: cents(mkbVrijstelling),
    kiaCents: cents(kia),
    totalDeductionsCents: cents(totalDeductions),
  };
}

/**
 * Computes progressive Box 1 Dutch income tax on taxable business income.
 */
export function computeBox1Tax(
  taxableIncomeCents: Cents,
  params: TaxParams,
): {
  readonly box1GrossTaxCents: Cents;
  readonly heffingskortingenCents: Cents;
  readonly netBox1TaxCents: Cents;
} {
  if (taxableIncomeCents <= 0) {
    return {
      box1GrossTaxCents: cents(0),
      heffingskortingenCents: cents(0),
      netBox1TaxCents: cents(0),
    };
  }

  const schijf1Upper = params.schijf1UpperCents;
  const rate1 = params.schijf1RateBps / 10_000;
  const rate2 = params.schijf2RateBps / 10_000;

  const part1 = Math.min(taxableIncomeCents, schijf1Upper);
  const part2 = Math.max(0, taxableIncomeCents - schijf1Upper);

  const grossTax = Math.round(part1 * rate1 + part2 * rate2);

  // General tax credits (algemene heffingskorting + arbeidskorting)
  // Simplified realistic phase-out for estimation:
  let algKorting: number = params.algHeffingskortingMaxCents;
  const phaseOutStart = 2840600; // € 28.406
  if (taxableIncomeCents > phaseOutStart) {
    const excess = taxableIncomeCents - phaseOutStart;
    algKorting = Math.max(0, Math.round(algKorting - excess * 0.0633));
  }

  // Arbeidskorting estimation for active entrepreneurs
  const arbeidskorting = Math.min(params.arbeidskortingMaxCents, Math.round(taxableIncomeCents * 0.08));

  const totalCredits = algKorting + arbeidskorting;
  const netTax = Math.max(0, grossTax - totalCredits);

  return {
    box1GrossTaxCents: cents(grossTax),
    heffingskortingenCents: cents(totalCredits),
    netBox1TaxCents: cents(netTax),
  };
}

/**
 * Computes Box 3 Dutch wealth tax estimate (peildatum 1 januari).
 */
export function computeBox3Tax(
  assetsCents: Cents = cents(0),
  debtsCents: Cents = cents(0),
  params: TaxParams = getTaxParams(2026),
): Box3Snapshot {
  const netWealth = Math.max(0, assetsCents - debtsCents);
  const taxableBase = Math.max(0, netWealth - params.box3VrijstellingCents);

  // 2026 Box 3 effective rate: ~1.97% on taxable wealth above exemption
  const estimatedTax = Math.round(taxableBase * 0.0197);

  return {
    assetsCents,
    debtsCents,
    exemptionCents: params.box3VrijstellingCents,
    taxableBaseCents: cents(taxableBase),
    estimatedTaxCents: cents(estimatedTax),
  };
}

/**
 * Computes complete annual tax return projection for a freelancer.
 */
export function computeAnnualTaxReturn(
  transactions: readonly BusinessTransaction[],
  options: {
    readonly year: number;
    readonly config: AnnualTaxConfig;
    readonly status?: FilingStatus | undefined;
    readonly params?: TaxParams | undefined;
  },
): AnnualTaxReturn {
  const { year, config, status = 'in_progress' } = options;
  const params = options.params ?? getTaxParams(year);

  const baseProfit = computeAnnualProfit(transactions, year);
  const extraExpenses = (config.mileageAllowanceCents ?? 0) + (config.assetDepreciationCents ?? 0);
  const totalDeductibleExpenses = cents(baseProfit.deductibleExpensesCents + extraExpenses);
  const adjustedProfit = cents(Math.max(0, baseProfit.grossIncomeCents - totalDeductibleExpenses));

  const deductions = computeZzpDeductions(adjustedProfit, config, params);

  const taxableIncome = Math.max(0, adjustedProfit - deductions.totalDeductionsCents);
  const box1 = computeBox1Tax(cents(taxableIncome), params);

  let box3: Box3Snapshot | null = null;
  if (config.box3AssetsCents !== undefined) {
    box3 = computeBox3Tax(config.box3AssetsCents, config.box3DebtsCents ?? cents(0), params);
  }

  const box3Tax = box3?.estimatedTaxCents ?? 0;
  const totalTaxDue = box1.netBox1TaxCents + box3Tax;

  return {
    year,
    grossIncomeCents: baseProfit.grossIncomeCents,
    deductibleExpensesCents: totalDeductibleExpenses,
    profitCents: adjustedProfit,
    deductions,
    taxableIncomeCents: cents(taxableIncome),
    box1TaxCents: box1.box1GrossTaxCents,
    heffingskortingenCents: box1.heffingskortingenCents,
    estimatedIncomeTaxCents: box1.netBox1TaxCents,
    box3,
    totalTaxDueCents: cents(totalTaxDue),
    status,
  };
}
