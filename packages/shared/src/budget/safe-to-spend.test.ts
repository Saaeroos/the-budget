import { describe, expect, it } from 'vitest';
import { nlDate } from '../dates';
import { cents } from '../money';
import { safeToSpend, type SafeToSpendInputs } from './safe-to-spend';
import { ACCOUNT_TYPE, ROLLOVER_MODE, TXN_DIRECTION } from './types';

function baseInputs(overrides: Partial<SafeToSpendInputs> = {}): SafeToSpendInputs {
  return {
    today: nlDate('2026-03-10'),
    periodEndsOn: nlDate('2026-03-31'),
    accounts: [{ includeInBudget: true, type: ACCOUNT_TYPE.payment, balanceCents: cents(200_000) }],
    pendingTransactions: [],
    fixedDue: [],
    envelopeContributionsDue: [],
    householdLines: [],
    incomeEvents: [],
    bufferCents: cents(10_000),
    ...overrides,
  };
}

describe('safeToSpend', () => {
  it('returns unknown when there is no balance data at all, never a computed 0', () => {
    const result = safeToSpend(baseInputs({ accounts: [] }));
    expect(result).toEqual({ status: 'unknown' });
  });

  it('sums only included, non-savings account balances into liquidBalance', () => {
    const result = safeToSpend(
      baseInputs({
        accounts: [
          { includeInBudget: true, type: ACCOUNT_TYPE.payment, balanceCents: cents(100_000) },
          { includeInBudget: true, type: ACCOUNT_TYPE.savings, balanceCents: cents(500_000) },
          { includeInBudget: false, type: ACCOUNT_TYPE.payment, balanceCents: cents(999_999) },
          { includeInBudget: true, type: ACCOUNT_TYPE.joint, balanceCents: cents(50_000) },
        ],
      }),
    );
    expect(result.status).toBe('known');
    if (result.status === 'known') {
      expect(result.value.components.liquidBalance).toBe(150_000);
    }
  });

  it('subtracts pending outbound transactions but ignores pending inbound ones', () => {
    const result = safeToSpend(
      baseInputs({
        pendingTransactions: [
          { direction: TXN_DIRECTION.out, amountCents: cents(8000) },
          { direction: TXN_DIRECTION.in, amountCents: cents(3000) },
        ],
      }),
    );
    expect(result.status).toBe('known');
    if (result.status === 'known') {
      expect(result.value.components.pendingOut).toBe(8000);
    }
  });

  it('includes fixed-due items within the period and excludes those outside it', () => {
    const result = safeToSpend(
      baseInputs({
        fixedDue: [
          { dueOn: nlDate('2026-03-20'), amountCents: cents(5000) },
          { dueOn: nlDate('2026-03-05'), amountCents: cents(9999) }, // before today, excluded
          { dueOn: nlDate('2026-04-05'), amountCents: cents(1234) }, // after period end, excluded
        ],
      }),
    );
    expect(result.status).toBe('known');
    if (result.status === 'known') {
      expect(result.value.components.fixedStillDue).toBe(5000);
    }
  });

  it('sums only the unfunded portion of each envelope contribution due, floored at 0', () => {
    const result = safeToSpend(
      baseInputs({
        envelopeContributionsDue: [
          { requiredCents: cents(5000), contributedCents: cents(2000) },
          { requiredCents: cents(3000), contributedCents: cents(5000) }, // over-funded -> 0
        ],
      }),
    );
    expect(result.status).toBe('known');
    if (result.status === 'known') {
      expect(result.value.components.reservationsDue).toBe(3000);
    }
  });

  it('sums only the positive remaining huishoudelijk budget across lines', () => {
    const result = safeToSpend(
      baseInputs({
        householdLines: [
          { group: 'huishoudelijk', plannedCents: cents(10_000), carriedInCents: cents(0), actualCents: cents(4000), rolloverMode: ROLLOVER_MODE.none },
          { group: 'huishoudelijk', plannedCents: cents(5000), carriedInCents: cents(0), actualCents: cents(9000), rolloverMode: ROLLOVER_MODE.none },
        ],
      }),
    );
    expect(result.status).toBe('known');
    if (result.status === 'known') {
      expect(result.value.components.householdRemaining).toBe(6000);
    }
  });

  it('counts only confirmed income events within the period', () => {
    const result = safeToSpend(
      baseInputs({
        incomeEvents: [
          { expectedOn: nlDate('2026-03-24'), amountCents: cents(250_000), confirmed: true },
          { expectedOn: nlDate('2026-03-24'), amountCents: cents(999_999), confirmed: false },
        ],
      }),
    );
    expect(result.status).toBe('known');
    if (result.status === 'known') {
      expect(result.value.components.incomeExpected).toBe(250_000);
    }
  });

  it('computes the full formula, daysLeft and perDay', () => {
    const result = safeToSpend(
      baseInputs({
        today: nlDate('2026-03-01'),
        periodEndsOn: nlDate('2026-03-10'),
        accounts: [{ includeInBudget: true, type: ACCOUNT_TYPE.payment, balanceCents: cents(100_000) }],
        bufferCents: cents(10_000),
      }),
    );
    expect(result.status).toBe('known');
    if (result.status === 'known') {
      // 100000 - 0 + 0 - 0 - 0 - 0 - 10000 = 90000; daysLeft = 9 + 1 = 10; perDay = 9000
      expect(result.value.amount).toBe(90_000);
      expect(result.value.daysLeft).toBe(10);
      expect(result.value.perDay).toBe(9000);
    }
  });

  it('goes negative when fixed costs and buffer exceed the balance (UI shows €0 + shortfall)', () => {
    const result = safeToSpend(
      baseInputs({
        accounts: [{ includeInBudget: true, type: ACCOUNT_TYPE.payment, balanceCents: cents(5000) }],
        fixedDue: [{ dueOn: nlDate('2026-03-15'), amountCents: cents(50_000) }],
        bufferCents: cents(10_000),
      }),
    );
    expect(result.status).toBe('known');
    if (result.status === 'known') {
      expect(result.value.amount).toBeLessThan(0);
    }
  });
});
