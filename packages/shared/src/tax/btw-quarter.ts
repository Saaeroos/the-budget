import { cents } from '../money';
import { nlDate, parseNLDate, type NLDate } from '../dates';
import type {
  BtwAangifte,
  BtwRubrieken,
  BusinessTransaction,
  FilingStatus,
  QuarterNumber,
  TaxQuarter,
} from './types';

/* ── Text ─────────────────────────────────────────────── */
export const BTW_TEXT = {
  quarterLabel: 'tax.btw: Q{{quarter}} {{year}}',
} as const;

/* ── Types ────────────────────────────────────────────── */
// (types defined in ./types)

/* ── Implementation ───────────────────────────────────── */

/**
 * Returns the TaxQuarter for a specific year and quarter number.
 */
export function quarterByNumber(year: number, quarter: QuarterNumber): TaxQuarter {
  const y = String(year);
  switch (quarter) {
    case 1:
      return {
        quarter: 1,
        year,
        startsOn: nlDate(`${y}-01-01`),
        endsOn: nlDate(`${y}-03-31`),
        filingDeadline: nlDate(`${y}-04-30`),
        label: `Q1 ${y}`,
      };
    case 2:
      return {
        quarter: 2,
        year,
        startsOn: nlDate(`${y}-04-01`),
        endsOn: nlDate(`${y}-06-30`),
        filingDeadline: nlDate(`${y}-07-31`),
        label: `Q2 ${y}`,
      };
    case 3:
      return {
        quarter: 3,
        year,
        startsOn: nlDate(`${y}-07-01`),
        endsOn: nlDate(`${y}-09-30`),
        filingDeadline: nlDate(`${y}-10-31`),
        label: `Q3 ${y}`,
      };
    case 4:
      return {
        quarter: 4,
        year,
        startsOn: nlDate(`${y}-10-01`),
        endsOn: nlDate(`${y}-12-31`),
        filingDeadline: nlDate(`${year + 1}-01-31`),
        label: `Q4 ${y}`,
      };
  }
}

/**
 * Determines which fiscal tax quarter a given business date falls in.
 */
export function quarterForDate(today: NLDate): TaxQuarter {
  const [yearStr, monthStr] = today.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);

  let q: QuarterNumber = 1;
  if (month >= 1 && month <= 3) {
    q = 1;
  } else if (month >= 4 && month <= 6) {
    q = 2;
  } else if (month >= 7 && month <= 9) {
    q = 3;
  } else {
    q = 4;
  }

  return quarterByNumber(year, q);
}

/**
 * Returns all 4 quarters for a given year.
 */
export function allQuartersForYear(year: number): readonly TaxQuarter[] {
  return [
    quarterByNumber(year, 1),
    quarterByNumber(year, 2),
    quarterByNumber(year, 3),
    quarterByNumber(year, 4),
  ];
}

/**
 * Checks whether a date falls inside the bounds of the given tax quarter.
 */
export function isInQuarter(date: NLDate, quarter: TaxQuarter): boolean {
  return date >= quarter.startsOn && date <= quarter.endsOn;
}

/**
 * Computes calendar days remaining until the quarter's filing deadline from `today`.
 * Returns negative if past deadline.
 */
export function daysUntilDeadline(quarter: TaxQuarter, today: NLDate): number {
  const deadlineDate = parseNLDate(quarter.filingDeadline);
  const todayDate = parseNLDate(today);
  const msDiff = deadlineDate.getTime() - todayDate.getTime();
  const MS_PER_DAY = 86_400_000;
  return Math.round(msDiff / MS_PER_DAY);
}

/**
 * Computes official Dutch Belastingdienst OB-form rubrieken and net VAT due
 * for the provided transactions in the given quarter.
 */
export function computeBtwAangifte(
  transactions: readonly BusinessTransaction[],
  quarter: TaxQuarter,
  status: FilingStatus = 'draft',
): BtwAangifte {
  const quarterTxs = transactions.filter((tx) => isInQuarter(tx.bookedAt, quarter));

  let r1aOmzet = 0;
  let r1bBtw = 0;
  let r1eOmzet = 0;
  let r1fBtw = 0;
  let r5bVoorbelasting = 0;

  for (const tx of quarterTxs) {
    const absAmount = Math.abs(tx.amountCents);
    const btwAmount = tx.btwAmountCents ? Math.abs(tx.btwAmountCents) : 0;

    if (tx.direction === 'in') {
      const omzetExclBtw = Math.max(0, absAmount - btwAmount);

      if (tx.btwRate === 21) {
        r1aOmzet += omzetExclBtw;
        r1bBtw += btwAmount;
      } else if (tx.btwRate === 9) {
        r1eOmzet += omzetExclBtw;
        r1fBtw += btwAmount;
      }
    } else if (tx.direction === 'out') {
      // Deductible expenses: default is deductible unless explicitly false
      const isDeductible = tx.isTaxDeductible !== false;
      if (isDeductible && btwAmount > 0) {
        r5bVoorbelasting += btwAmount;
      }
    }
  }

  const r5gSubtotaal = r1bBtw + r1fBtw - r5bVoorbelasting;

  const rubrieken: BtwRubrieken = {
    rubriek1aOmzetCents: cents(r1aOmzet),
    rubriek1bBtwCents: cents(r1bBtw),
    rubriek1eOmzetCents: cents(r1eOmzet),
    rubriek1fBtwCents: cents(r1fBtw),
    rubriek4aOmzetCents: cents(0),
    rubriek5bVoorbelastingCents: cents(r5bVoorbelasting),
    rubriek5gSubtotaalCents: cents(r5gSubtotaal),
  };

  return {
    quarter,
    rubrieken,
    totalDueCents: cents(r5gSubtotaal),
    status,
    transactionCount: quarterTxs.length,
  };
}
