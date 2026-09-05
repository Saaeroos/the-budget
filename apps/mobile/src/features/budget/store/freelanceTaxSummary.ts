import {
  cents,
  computeAnnualTaxReturn,
  computeBtwAangifte,
  daysUntilDeadline,
  getTaxParams,
  nlDate,
  quarterForDate,
  type AnnualTaxReturn,
  type BtwAangifte,
  type BusinessTransaction,
  type Cents,
  type NLDate,
  type TaxQuarter,
} from '@shared';
import { useBudgetStore } from './useBudgetStore';
import type { LocalAccount, LocalEnvelope, LocalTransaction } from './defaultBudgetFixtures';

/* ── Types ────────────────────────────────────────────── */

export interface FreelanceTaxSummary {
  readonly businessBalance: Cents;
  readonly btwCollected: Cents;
  readonly btwPaid: Cents;
  readonly netBtwDue: Cents;
  readonly estimatedProfit: Cents;
  readonly incomeTaxReserve: Cents;
  readonly trueTakeHome: Cents;
  readonly isBtwFunded: boolean;
  readonly quarterName: string;
  readonly quarterPeriod: string;
  readonly filingDeadline: string;
  readonly daysUntilDeadline: number;
  readonly currentQuarter: TaxQuarter;
  readonly btwAangifte: BtwAangifte;
  readonly annualReturn: AnnualTaxReturn;
}

export interface ComputeTaxInputs {
  readonly accounts: readonly LocalAccount[];
  readonly transactions: readonly LocalTransaction[];
  readonly envelopes: readonly LocalEnvelope[];
  readonly today?: NLDate | undefined;
}

/* ── Calculation Helpers ──────────────────────────────── */

function toBusinessTx(tx: LocalTransaction): BusinessTransaction {
  return {
    id: tx.id,
    amountCents: tx.amountCents,
    btwRate: tx.btwRate,
    btwAmountCents: tx.btwAmountCents,
    direction: tx.amountCents > 0 ? 'in' : 'out',
    bookedAt: tx.date ? nlDate(tx.date) : nlDate('2026-09-05'),
    isTaxDeductible: true,
    description: tx.description,
    counterpartyName: tx.counterpartyName,
  };
}

export function computeFreelanceTaxSummary(inputs: ComputeTaxInputs): FreelanceTaxSummary {
  const { accounts, transactions, envelopes, today = nlDate('2026-09-05') } = inputs;

  const bizAccounts = accounts.filter((a) => a.scope === 'business');
  const businessBalance = cents(bizAccounts.reduce((sum, a) => sum + a.balanceCents, 0));

  const bizTxs = transactions
    .filter((t) => t.scope === 'business')
    .map(toBusinessTx);

  const quarter = quarterForDate(today);
  const aangifte = computeBtwAangifte(bizTxs, quarter);
  const remainingDays = daysUntilDeadline(quarter, today);

  // Annual tax projection
  const params = getTaxParams(quarter.year);
  const annual = computeAnnualTaxReturn(bizTxs, {
    year: quarter.year,
    config: { isStarter: true, meetsHourCriterion: true },
    status: 'in_progress',
    params,
  });

  const netBtwDue = Math.max(0, aangifte.totalDueCents);
  // Reserve 30% of profit or estimated tax
  const incomeTaxReserve = Math.round(annual.profitCents * 0.3);
  const trueTakeHome = cents(businessBalance - netBtwDue - incomeTaxReserve);

  const btwEnv = envelopes.find((e) => e.id === 'btw_q3' || e.name.toLowerCase().includes('btw'));
  const isBtwFunded = (btwEnv?.currentCents ?? 0) >= netBtwDue;

  return {
    businessBalance,
    btwCollected: cents(aangifte.rubrieken.rubriek1bBtwCents + aangifte.rubrieken.rubriek1fBtwCents),
    btwPaid: aangifte.rubrieken.rubriek5bVoorbelastingCents,
    netBtwDue: cents(netBtwDue),
    estimatedProfit: annual.profitCents,
    incomeTaxReserve: cents(incomeTaxReserve),
    trueTakeHome,
    isBtwFunded,
    quarterName: quarter.label,
    quarterPeriod: '1 jul – 30 sep',
    filingDeadline: '31 okt 2026',
    daysUntilDeadline: remainingDays,
    currentQuarter: quarter,
    btwAangifte: aangifte,
    annualReturn: annual,
  };
}

/* ── Hook ─────────────────────────────────────────────── */

export function useFreelanceTaxSummary(): FreelanceTaxSummary {
  const accounts = useBudgetStore((s) => s.accounts);
  const transactions = useBudgetStore((s) => s.transactions);
  const envelopes = useBudgetStore((s) => s.envelopes);

  return computeFreelanceTaxSummary({ accounts, transactions, envelopes });
}
