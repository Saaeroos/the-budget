import { cents, type Cents } from '../money';
import type {
  AssetDepreciationSchedule,
  AssetDepreciationYear,
  BusinessAsset,
} from './types';

/* ── Constants & Text ─────────────────────────────────── */
export const ASSETS_TEXT = {
  thresholdNotice: 'tax.assets: investments > €450 excl. BTW must be depreciated',
} as const;

/** Belastingdienst threshold: €450 excl. BTW (45,000 cents) */
export const ASSET_INVESTMENT_THRESHOLD_CENTS = 45000;

/** KIA lower threshold: €2.801 (280,100 cents) */
export const KIA_LOWER_THRESHOLD_CENTS = 280100;

/** KIA tier 1 upper bound: €69.764 (6,976,400 cents) */
export const KIA_TIER1_UPPER_CENTS = 6976400;

/** KIA tier 2 upper bound: €129.213 (12,921,300 cents) */
export const KIA_TIER2_UPPER_CENTS = 12921300;

/** KIA maximum bound: €380.000 (38,000,000 cents) */
export const KIA_MAX_INVESTMENT_CENTS = 38000000;

/* ── Pure Functions ───────────────────────────────────── */

/**
 * Checks if a purchase amount (excl. BTW) qualifies as an asset investment (> €450).
 */
export function isAssetInvestment(amountExclBtwCents: Cents): boolean {
  return amountExclBtwCents > ASSET_INVESTMENT_THRESHOLD_CENTS;
}

/**
 * Computes Kleinschaligheidsinvesteringsaftrek (KIA) according to Dutch fiscal brackets.
 */
export function computeKiaDeduction(totalInvestmentsCents: Cents): Cents {
  if (totalInvestmentsCents < KIA_LOWER_THRESHOLD_CENTS) {
    return cents(0);
  }
  if (totalInvestmentsCents <= KIA_TIER1_UPPER_CENTS) {
    // 28% of total qualifying investments
    return cents(Math.round(totalInvestmentsCents * 0.28));
  }
  if (totalInvestmentsCents <= KIA_TIER2_UPPER_CENTS) {
    // Fixed amount for tier 2 (€19.534 in 2026)
    return cents(1953400);
  }
  if (totalInvestmentsCents <= KIA_MAX_INVESTMENT_CENTS) {
    // Fixed €19.534 minus 7.56% of (investment - €129.213)
    const excess = totalInvestmentsCents - KIA_TIER2_UPPER_CENTS;
    const reduction = Math.round(excess * 0.0756);
    return cents(Math.max(0, 1953400 - reduction));
  }
  return cents(0);
}

/**
 * Computes depreciation for a specific year, taking pro-rata purchase month into account.
 */
export function computeAnnualDepreciation(asset: BusinessAsset, targetYear: number): Cents {
  const purchaseYear = parseInt(asset.purchaseDate.slice(0, 4), 10);
  const purchaseMonth = parseInt(asset.purchaseDate.slice(5, 7), 10);

  if (targetYear < purchaseYear) {
    return cents(0);
  }

  const depreciableBase = Math.max(0, asset.purchaseCostCents - asset.residualValueCents);
  if (depreciableBase <= 0 || asset.lifespanMonths <= 0) {
    return cents(0);
  }

  const monthlyRate = depreciableBase / asset.lifespanMonths;
  const startMonthIndex = (purchaseYear * 12) + (purchaseMonth - 1);
  const targetYearStartMonth = targetYear * 12;
  const targetYearEndMonth = (targetYear * 12) + 11;

  // Active month range in target year
  const activeStart = Math.max(startMonthIndex, targetYearStartMonth);
  const activeEnd = Math.min(startMonthIndex + asset.lifespanMonths - 1, targetYearEndMonth);

  if (activeStart > activeEnd) {
    return cents(0);
  }

  const activeMonths = (activeEnd - activeStart) + 1;
  const rawDepreciation = Math.round(monthlyRate * activeMonths);

  // Ensure total accumulated depreciation does not exceed depreciableBase
  return cents(Math.min(depreciableBase, rawDepreciation));
}

/**
 * Generates a full depreciation schedule for an asset over its lifespan.
 */
export function generateDepreciationSchedule(
  asset: BusinessAsset,
  referenceYear: number,
): AssetDepreciationSchedule {
  const purchaseYear = parseInt(asset.purchaseDate.slice(0, 4), 10);
  const lifespanYears = Math.ceil(asset.lifespanMonths / 12);
  const years: AssetDepreciationYear[] = [];

  let currentBookValue = asset.purchaseCostCents;
  let currentYearDepreciation = cents(0);

  for (let y = purchaseYear; y <= purchaseYear + lifespanYears; y++) {
    const depreciation = computeAnnualDepreciation(asset, y);
    if (depreciation <= 0 && currentBookValue <= asset.residualValueCents) {
      break;
    }
    const safeDepreciation = Math.min(
      depreciation,
      Math.max(0, currentBookValue - asset.residualValueCents),
    );
    currentBookValue = cents(Math.max(asset.residualValueCents, currentBookValue - safeDepreciation));

    years.push({
      year: y,
      depreciationCents: cents(safeDepreciation),
      remainingBookValueCents: currentBookValue,
    });

    if (y === referenceYear) {
      currentYearDepreciation = cents(safeDepreciation);
    }
  }

  const annualStandard = cents(
    Math.round(
      Math.max(0, asset.purchaseCostCents - asset.residualValueCents) /
        (asset.lifespanMonths / 12),
    ),
  );

  return {
    assetId: asset.id,
    annualDepreciationCents: annualStandard,
    years,
    currentYearDepreciationCents: currentYearDepreciation,
    currentBookValueCents: currentBookValue,
  };
}

/**
 * Computes total depreciation across all assets for a given tax year.
 */
export function computeTotalDepreciationForYear(
  assets: readonly BusinessAsset[],
  year: number,
): Cents {
  let total = 0;
  for (const asset of assets) {
    total += computeAnnualDepreciation(asset, year);
  }
  return cents(total);
}
