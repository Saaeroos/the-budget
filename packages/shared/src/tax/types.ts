import type { Cents } from '../money';
import type { NLDate } from '../dates';

/* ── Text ─────────────────────────────────────────────── */
export const TAX_TEXT = {
  invalidBtwRate: 'tax.types: invalid BTW rate, must be 0, 9, or 21',
} as const;

/* ── Types ────────────────────────────────────────────── */

export const BTW_RATE = {
  zero: 0,
  low: 9,
  high: 21,
} as const;
export type BtwRate = (typeof BTW_RATE)[keyof typeof BTW_RATE];

export const FILING_STATUS = {
  draft: 'draft',
  ready: 'ready',
  filed: 'filed',
  paid: 'paid',
  inProgress: 'in_progress',
} as const;
export type FilingStatus = (typeof FILING_STATUS)[keyof typeof FILING_STATUS];

export type QuarterNumber = 1 | 2 | 3 | 4;

export interface TaxQuarter {
  readonly quarter: QuarterNumber;
  readonly year: number;
  readonly startsOn: NLDate;
  readonly endsOn: NLDate;
  readonly filingDeadline: NLDate;
  readonly label: string;
}

export interface BusinessTransaction {
  readonly id: string;
  readonly amountCents: Cents;
  readonly btwRate?: BtwRate | undefined;
  readonly btwAmountCents?: Cents | undefined;
  readonly direction: 'in' | 'out';
  readonly bookedAt: NLDate;
  readonly isTaxDeductible?: boolean | undefined;
  readonly description?: string | undefined;
  readonly counterpartyName?: string | undefined;
}

export interface BtwRubrieken {
  /** 1a: Leveringen/diensten belast met hoog tarief 21% (omzet excl. BTW) */
  readonly rubriek1aOmzetCents: Cents;
  /** 1b: Omzetbelasting hoog tarief 21% */
  readonly rubriek1bBtwCents: Cents;
  /** 1e: Leveringen/diensten belast met laag tarief 9% (omzet excl. BTW) */
  readonly rubriek1eOmzetCents: Cents;
  /** 1f: Omzetbelasting laag tarief 9% */
  readonly rubriek1fBtwCents: Cents;
  /** 4a: Leveringen/diensten uit landen binnen de EU */
  readonly rubriek4aOmzetCents: Cents;
  /** 5b: Voorbelasting (BTW op zakelijke kosten) */
  readonly rubriek5bVoorbelastingCents: Cents;
  /** 5g: Totaal te betalen of terug te ontvangen (1b + 1f - 5b) */
  readonly rubriek5gSubtotaalCents: Cents;
}

export interface BtwAangifte {
  readonly quarter: TaxQuarter;
  readonly rubrieken: BtwRubrieken;
  readonly totalDueCents: Cents;
  readonly status: FilingStatus;
  readonly transactionCount: number;
}

export interface ZzpDeductions {
  readonly zelfstandigenaftrekCents: Cents;
  readonly startersaftrekCents: Cents;
  readonly mkbVrijstellingCents: Cents;
  readonly kiaCents: Cents;
  readonly totalDeductionsCents: Cents;
}

export interface Box3Snapshot {
  readonly assetsCents: Cents;
  readonly debtsCents: Cents;
  readonly exemptionCents: Cents;
  readonly taxableBaseCents: Cents;
  readonly estimatedTaxCents: Cents;
}

export interface TaxParams {
  readonly year: number;
  readonly zelfstandigenaftrekCents: Cents;
  readonly startersaftrekCents: Cents;
  readonly mkbVrijstellingBps: number;
  readonly schijf1UpperCents: Cents;
  readonly schijf1RateBps: number;
  readonly schijf2RateBps: number;
  readonly algHeffingskortingMaxCents: Cents;
  readonly arbeidskortingMaxCents: Cents;
  readonly box3VrijstellingCents: Cents;
  readonly korDrempelCents: Cents;
}

export interface AnnualTaxConfig {
  readonly isStarter: boolean;
  readonly meetsHourCriterion: boolean; // 1225 uren criterium
  readonly investmentsCents?: Cents | undefined;
  readonly mileageAllowanceCents?: Cents | undefined;
  readonly assetDepreciationCents?: Cents | undefined;
  readonly box3AssetsCents?: Cents | undefined;
  readonly box3DebtsCents?: Cents | undefined;
}

export const VEHICLE_TYPE = {
  private: 'private',
  business: 'business',
} as const;
export type VehicleType = (typeof VEHICLE_TYPE)[keyof typeof VEHICLE_TYPE];

export interface BusinessTrip {
  readonly id: string;
  readonly tripDate: NLDate;
  readonly departureLocation: string;
  readonly destinationLocation: string;
  readonly distanceKm: number;
  readonly isRoundTrip: boolean;
  readonly rateCentsPerKm: number;
  readonly purpose: string;
  readonly counterpartyName?: string | undefined;
  readonly vehicleType: VehicleType;
  readonly reimbursedAt?: string | undefined;
}

export interface MileageSummary {
  readonly totalDistanceKm: number;
  readonly totalAllowanceCents: Cents;
  readonly reimbursedAllowanceCents: Cents;
  readonly pendingReimbursementCents: Cents;
  readonly tripCount: number;
}

export const ASSET_CATEGORY = {
  hardware: 'hardware',
  phone: 'phone',
  furniture: 'furniture',
  tools: 'tools',
  vehicle: 'vehicle',
  other: 'other',
} as const;
export type AssetCategory = (typeof ASSET_CATEGORY)[keyof typeof ASSET_CATEGORY];

export interface BusinessAsset {
  readonly id: string;
  readonly name: string;
  readonly category: AssetCategory;
  readonly purchaseDate: NLDate;
  readonly purchaseCostCents: Cents;
  readonly residualValueCents: Cents;
  readonly lifespanMonths: number;
  readonly btwRate: BtwRate;
  readonly btwAmountCents: Cents;
  readonly isKiaEligible: boolean;
  readonly transactionId?: string | undefined;
}

export interface AssetDepreciationYear {
  readonly year: number;
  readonly depreciationCents: Cents;
  readonly remainingBookValueCents: Cents;
}

export interface AssetDepreciationSchedule {
  readonly assetId: string;
  readonly annualDepreciationCents: Cents;
  readonly years: readonly AssetDepreciationYear[];
  readonly currentYearDepreciationCents: Cents;
  readonly currentBookValueCents: Cents;
}

export const EXPENSE_CATEGORY_KIND = {
  standard: 'standard',
  horeca: 'horeca',
  telecom: 'telecom',
  workspace: 'workspace',
} as const;
export type ExpenseCategoryKind = (typeof EXPENSE_CATEGORY_KIND)[keyof typeof EXPENSE_CATEGORY_KIND];

export interface MixedExpenseRule {
  readonly categoryKind: ExpenseCategoryKind;
  readonly incomeTaxDeductiblePercent: number;
  readonly btwDeductiblePercent: number;
  readonly isPrivateAdvance?: boolean | undefined;
}

export interface ExpenseTaxCalculation {
  readonly originalAmountCents: Cents;
  readonly deductibleAmountCents: Cents;
  readonly deductibleBtwCents: Cents;
  readonly nonDeductibleAmountCents: Cents;
  readonly isHorecaRestricted: boolean;
}

export interface AnnualTaxOptions {
  readonly year: number;
  readonly config: AnnualTaxConfig;
  readonly status?: FilingStatus | undefined;
  readonly params?: TaxParams | undefined;
}

export interface AnnualTaxReturn {
  readonly year: number;
  readonly grossIncomeCents: Cents;
  readonly deductibleExpensesCents: Cents;
  readonly profitCents: Cents;
  readonly deductions: ZzpDeductions;
  readonly taxableIncomeCents: Cents;
  readonly box1TaxCents: Cents;
  readonly heffingskortingenCents: Cents;
  readonly estimatedIncomeTaxCents: Cents;
  readonly box3: Box3Snapshot | null;
  readonly totalTaxDueCents: Cents;
  readonly status: FilingStatus;
}
