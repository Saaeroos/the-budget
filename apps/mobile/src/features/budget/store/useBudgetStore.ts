import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  cents,
  nlDate,
  nlDateFromJsDate,
  safeToSpend,
  type Cents,
  type QuarterNumber,
  type SafeToSpend,
} from '@shared';
import { prefsStorage, toPersistStorage } from '@/lib/storage';
import {
  createDefaultAccounts,
  createDefaultEnvelopes,
  createDefaultTransactions,
  createDefaultUpcomingBills,
  type BucketKind,
  type LocalAccount,
  type LocalEnvelope,
  type LocalTransaction,
  type LocalUpcomingBill,
} from './defaultBudgetFixtures';
import {
  createDefaultYearlyExpenses,
  type LocalYearlyExpense,
} from './yearlyExpensesFixtures';

/* ── Types ────────────────────────────────────────────── */

export type {
  BucketKind,
  LocalAccount,
  LocalEnvelope,
  LocalTransaction,
  LocalUpcomingBill,
  LocalYearlyExpense,
};

export type ActiveScope = 'all' | 'personal' | 'household' | 'business';

export interface BudgetState {
  readonly accounts: readonly LocalAccount[];
  readonly transactions: readonly LocalTransaction[];
  readonly envelopes: readonly LocalEnvelope[];
  readonly upcomingBills: readonly LocalUpcomingBill[];
  readonly yearlyExpenses: readonly LocalYearlyExpense[];
  readonly bufferCents: Cents;
  readonly periodLabel: string;
  readonly activeScope: ActiveScope;
  readonly filedBtwQuarters: readonly QuarterNumber[];
  readonly setActiveScope: (scope: ActiveScope) => void;
  readonly toggleQuarterFiled: (quarter: QuarterNumber) => void;
  readonly addTransaction: (tx: Omit<LocalTransaction, 'id'>) => void;
  readonly categorizeTransaction: (id: string, categoryKey: string, bucket: BucketKind) => void;
  readonly addEnvelope: (envelope: Omit<LocalEnvelope, 'id'>) => void;
  readonly depositToEnvelope: (id: string, amountCents: Cents) => void;
  readonly addYearlyExpense: (expense: Omit<LocalYearlyExpense, 'id'>) => void;
  readonly setAccountBalance: (id: string, balanceCents: Cents) => void;
  readonly initFromOnboardingEnvelope: (firstEnvelope: { id: string; name: string; targetCents: number; monthlyCents: number; icon: string }) => void;
  readonly resetBudget: () => void;
}

/* ── Implementation Helpers ───────────────────────────── */

function toggleQuarter(
  quarters: readonly QuarterNumber[],
  q: QuarterNumber,
): readonly QuarterNumber[] {
  const exists = quarters.includes(q);
  return exists ? quarters.filter((item) => item !== q) : [...quarters, q].sort((a, b) => a - b);
}

function getInitialBudgetState() {
  return {
    accounts: createDefaultAccounts(),
    transactions: createDefaultTransactions(),
    envelopes: createDefaultEnvelopes(),
    upcomingBills: createDefaultUpcomingBills(),
    yearlyExpenses: createDefaultYearlyExpenses(),
    bufferCents: cents(50000),
    periodLabel: '1 sep – 30 sep',
    activeScope: 'all' as ActiveScope,
    filedBtwQuarters: [1, 2] as readonly QuarterNumber[],
  };
}

function appendOnboardingEnvelope(
  envelopes: readonly LocalEnvelope[],
  first: { id: string; name: string; targetCents: number; monthlyCents: number; icon: string },
): readonly LocalEnvelope[] {
  if (envelopes.some((e) => e.id === first.id)) return envelopes;
  return [
    {
      id: first.id,
      name: first.name,
      targetCents: cents(first.targetCents),
      currentCents: cents(0),
      monthlyCents: cents(first.monthlyCents),
      icon: first.icon,
      isBehind: false,
    },
    ...envelopes,
  ];
}

/* ── Implementation ───────────────────────────────────── */

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      ...getInitialBudgetState(),

      addTransaction: (tx) =>
        set((s) => ({
          transactions: [{ ...tx, id: `tx-${Date.now()}` }, ...s.transactions],
        })),

      categorizeTransaction: (id, categoryKey, bucket) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, categoryKey, bucket, isReviewed: true } : t,
          ),
        })),

      addEnvelope: (env) =>
        set((s) => ({
          envelopes: [...s.envelopes, { ...env, id: `env-${Date.now()}` }],
        })),

      depositToEnvelope: (id, amount) =>
        set((s) => ({
          envelopes: s.envelopes.map((e) =>
            e.id === id ? { ...e, currentCents: cents(e.currentCents + amount) } : e,
          ),
        })),

      addYearlyExpense: (exp) =>
        set((s) => ({
          yearlyExpenses: [...s.yearlyExpenses, { ...exp, id: `yr-${Date.now()}` }],
        })),

      setAccountBalance: (id, balanceCents) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, balanceCents } : a)),
        })),

      initFromOnboardingEnvelope: (first) =>
        set((s) => ({ envelopes: appendOnboardingEnvelope(s.envelopes, first) })),

      setActiveScope: (activeScope) => set({ activeScope }),
      toggleQuarterFiled: (q) =>
        set((s) => ({ filedBtwQuarters: toggleQuarter(s.filedBtwQuarters ?? [], q) })),

      resetBudget: () => set(getInitialBudgetState()),
    }),
    {
      name: 'kwartje.budget',
      storage: createJSONStorage(() => toPersistStorage(prefsStorage)),
    },
  ),
);

/* ── Selectors / Helpers ──────────────────────────────── */

export function useActiveScope(): ActiveScope {
  return useBudgetStore((s) => s.activeScope);
}

export function useFilteredAccounts(): readonly LocalAccount[] {
  const accounts = useBudgetStore((s) => s.accounts);
  const activeScope = useBudgetStore((s) => s.activeScope);
  if (activeScope === 'all') return accounts;
  return accounts.filter((a) => (a.scope ?? 'personal') === activeScope);
}

export function useFilteredTransactions(): readonly LocalTransaction[] {
  const transactions = useBudgetStore((s) => s.transactions);
  const activeScope = useBudgetStore((s) => s.activeScope);
  if (activeScope === 'all') return transactions;
  return transactions.filter((t) => (t.scope ?? 'personal') === activeScope);
}

const EMPTY_SAFE_TO_SPEND: SafeToSpend = {
  amount: cents(0),
  perDay: cents(0),
  daysLeft: 0,
  components: {
    liquidBalance: cents(0),
    pendingOut: cents(0),
    fixedStillDue: cents(0),
    reservationsDue: cents(0),
    householdRemaining: cents(0),
    incomeExpected: cents(0),
    buffer: cents(0),
  },
};

function calculateSafeToSpend(
  state: Pick<BudgetState, 'accounts' | 'transactions' | 'upcomingBills' | 'envelopes' | 'bufferCents'>,
): SafeToSpend {
  const { accounts, transactions, upcomingBills, envelopes, bufferCents } = state;
  const result = safeToSpend({
    today: nlDateFromJsDate(new Date()),
    periodEndsOn: nlDate('2026-09-30'),
    accounts: accounts
      .filter((a) => a.scope !== 'business')
      .map((a) => ({
        includeInBudget: a.type === 'payment',
        type: a.type,
        balanceCents: a.balanceCents,
      })),
    pendingTransactions: transactions
      .filter((t) => t.isPending)
      .map((t) => ({
        direction: t.amountCents < 0 ? 'out' : 'in',
        amountCents: cents(Math.abs(t.amountCents)),
      })),
    fixedDue: upcomingBills.map((b) => ({ dueOn: nlDate(b.dueOn), amountCents: b.amountCents })),
    envelopeContributionsDue: envelopes.map((e) => ({
      requiredCents: e.monthlyCents,
      contributedCents: cents(Math.min(e.currentCents, e.monthlyCents)),
    })),
    householdLines: [],
    incomeEvents: [],
    bufferCents,
  });

  return result.status === 'known' ? result.value : EMPTY_SAFE_TO_SPEND;
}

export function useSafeToSpend(): SafeToSpend {
  const accounts = useBudgetStore((s) => s.accounts);
  const transactions = useBudgetStore((s) => s.transactions);
  const upcomingBills = useBudgetStore((s) => s.upcomingBills);
  const envelopes = useBudgetStore((s) => s.envelopes);
  const bufferCents = useBudgetStore((s) => s.bufferCents);

  return calculateSafeToSpend({ accounts, transactions, upcomingBills, envelopes, bufferCents });
}
