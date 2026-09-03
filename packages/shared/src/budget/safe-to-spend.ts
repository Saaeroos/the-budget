import { daysBetween, type NLDate } from '../dates';
import { cents, sub, sum, type Cents } from '../money';
import { available } from './available';
import { ACCOUNT_TYPE, TXN_DIRECTION, type AccountType, type BudgetLine, type TxnDirection } from './types';

/* ── Types ────────────────────────────────────────────── */
export interface AccountBalanceInput {
  readonly includeInBudget: boolean;
  readonly type: AccountType;
  readonly balanceCents: Cents;
}

export interface PendingTransactionInput {
  readonly direction: TxnDirection;
  readonly amountCents: Cents;
}

/** A confirmed recurring-series occurrence or obligation (instalment) with a due date. */
export interface DueItem {
  readonly dueOn: NLDate;
  readonly amountCents: Cents;
}

/** One potje's required contribution for the current period, and how much of it is already set aside. */
export interface EnvelopeContributionDue {
  readonly requiredCents: Cents;
  readonly contributedCents: Cents;
}

export interface IncomeEventInput {
  readonly expectedOn: NLDate;
  readonly amountCents: Cents;
  /** Only user-confirmed or ≥3-occurrence-stable income counts (`docs/10` §5) — the caller decides eligibility. */
  readonly confirmed: boolean;
}

export interface SafeToSpendInputs {
  readonly today: NLDate;
  readonly periodEndsOn: NLDate;
  readonly accounts: readonly AccountBalanceInput[];
  readonly pendingTransactions: readonly PendingTransactionInput[];
  readonly fixedDue: readonly DueItem[];
  readonly envelopeContributionsDue: readonly EnvelopeContributionDue[];
  readonly householdLines: readonly BudgetLine[];
  readonly incomeEvents: readonly IncomeEventInput[];
  readonly bufferCents: Cents;
}

export interface SafeToSpendComponents {
  readonly liquidBalance: Cents;
  readonly pendingOut: Cents;
  readonly fixedStillDue: Cents;
  readonly reservationsDue: Cents;
  readonly householdRemaining: Cents;
  readonly incomeExpected: Cents;
  readonly buffer: Cents;
}

export interface SafeToSpend {
  readonly amount: Cents;
  readonly perDay: Cents;
  readonly daysLeft: number;
  readonly components: SafeToSpendComponents;
}

/** Never a bare 0 when there is genuinely no balance data to compute from (`docs/10` §5). */
export type SafeToSpendResult = { readonly status: 'known'; readonly value: SafeToSpend } | { readonly status: 'unknown' };

/* ── Implementation ───────────────────────────────────── */

function sumLiquidBalance(accounts: readonly AccountBalanceInput[]): Cents {
  return sum(accounts.filter((a) => a.includeInBudget && a.type !== ACCOUNT_TYPE.savings).map((a) => a.balanceCents));
}

function sumPendingOut(transactions: readonly PendingTransactionInput[]): Cents {
  return sum(transactions.filter((t) => t.direction === TXN_DIRECTION.out).map((t) => t.amountCents));
}

function isWithinPeriod(date: NLDate, today: NLDate, periodEndsOn: NLDate): boolean {
  return date >= today && date <= periodEndsOn;
}

function sumDueBeforePeriodEnd(items: readonly DueItem[], today: NLDate, periodEndsOn: NLDate): Cents {
  return sum(items.filter((i) => isWithinPeriod(i.dueOn, today, periodEndsOn)).map((i) => i.amountCents));
}

function sumUnfundedContributions(items: readonly EnvelopeContributionDue[]): Cents {
  return sum(items.map((i) => cents(Math.max(0, sub(i.requiredCents, i.contributedCents)))));
}

function sumHouseholdRemaining(lines: readonly BudgetLine[]): Cents {
  return sum(lines.map((line) => cents(Math.max(0, available(line)))));
}

function sumConfirmedIncome(events: readonly IncomeEventInput[], today: NLDate, periodEndsOn: NLDate): Cents {
  return sum(events.filter((e) => e.confirmed && isWithinPeriod(e.expectedOn, today, periodEndsOn)).map((e) => e.amountCents));
}

function computeComponents(inputs: SafeToSpendInputs): SafeToSpendComponents {
  return {
    liquidBalance: sumLiquidBalance(inputs.accounts),
    pendingOut: sumPendingOut(inputs.pendingTransactions),
    fixedStillDue: sumDueBeforePeriodEnd(inputs.fixedDue, inputs.today, inputs.periodEndsOn),
    reservationsDue: sumUnfundedContributions(inputs.envelopeContributionsDue),
    householdRemaining: sumHouseholdRemaining(inputs.householdLines),
    incomeExpected: sumConfirmedIncome(inputs.incomeEvents, inputs.today, inputs.periodEndsOn),
    buffer: inputs.bufferCents,
  };
}

/**
 * The headline "veilig te besteden" number (`docs/10` §5). Returns `{ status: 'unknown' }`,
 * never a computed 0, when there is no balance data at all — a wrong number here destroys
 * trust permanently, so the UI must show "Onbekend" instead of a guess.
 */
export function safeToSpend(inputs: SafeToSpendInputs): SafeToSpendResult {
  if (inputs.accounts.length === 0) return { status: 'unknown' };

  const components = computeComponents(inputs);
  const amount = cents(
    components.liquidBalance -
      components.pendingOut +
      components.incomeExpected -
      components.fixedStillDue -
      components.reservationsDue -
      components.householdRemaining -
      components.buffer,
  );
  const daysLeft = daysBetween(inputs.today, inputs.periodEndsOn) + 1;
  const perDay = cents(Math.floor(amount / daysLeft));
  return { status: 'known', value: { amount, perDay, daysLeft, components } };
}
