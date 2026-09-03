import { describe, expect, it } from 'vitest';
import { nlDate } from '../dates';
import { cents } from '../money';
import { forecast, type ForecastInputs } from './forecast';
import { CADENCE } from './types';

function baseInputs(overrides: Partial<ForecastInputs> = {}): ForecastInputs {
  return {
    today: nlDate('2026-01-01'),
    startingBalanceCents: cents(500_000),
    series: [],
    obligations: [],
    incomeEvents: [],
    pendingTransactions: [],
    spendTransactions: [],
    bufferCents: cents(10_000),
    ...overrides,
  };
}

describe('forecast', () => {
  it('produces exactly 90 day points starting at today', () => {
    const days = forecast(baseInputs());
    expect(days).toHaveLength(90);
    expect(days[0]?.day).toBe('2026-01-01');
    expect(days[89]?.day).toBe('2026-03-31');
  });

  it('holds the balance flat when there is no variable spend and no events', () => {
    const days = forecast(baseInputs());
    expect(days.every((d) => d.balanceCents === 500_000)).toBe(true);
    expect(days.every((d) => !d.low)).toBe(true);
  });

  it('applies the trailing median daily huishoudelijk spend every day', () => {
    const spendTransactions = [
      {
        bookedAt: nlDate('2025-12-31'),
        direction: 'out' as const,
        categoryGroup: 'huishoudelijk' as const,
        amountCents: cents(2000),
        isTransfer: false,
        isExcluded: false,
      },
    ];
    const days = forecast(baseInputs({ spendTransactions }));
    // Only one non-zero day in a 90-day trailing window -> median is still 0, so the
    // balance stays flat; this proves the median (not a naive average) drives the drain.
    expect(days[0]?.balanceCents).toBe(500_000);
  });

  it('identifies the exact day an obligation drops the balance below the buffer', () => {
    const days = forecast(
      baseInputs({
        startingBalanceCents: cents(300_000),
        bufferCents: cents(25_000),
        obligations: [{ dueOn: nlDate('2026-01-10'), amountCents: cents(280_000) }],
      }),
    );
    const lowDay = days.find((d) => d.low);
    expect(lowDay?.day).toBe('2026-01-10');
    expect(lowDay?.balanceCents).toBe(20_000);
    expect(days.filter((d) => d.day < '2026-01-10').every((d) => !d.low)).toBe(true);
  });

  it('identifies the exact low-balance day for a €2400 annual bill due in 40 days (docs/10 §11)', () => {
    const today = nlDate('2026-01-01');
    const dueOn = nlDate('2026-02-10'); // 40 days after 2026-01-01
    const days = forecast(
      baseInputs({
        today,
        startingBalanceCents: cents(250_000),
        bufferCents: cents(15_000),
        obligations: [{ dueOn, amountCents: cents(240_000) }],
      }),
    );
    const lowDay = days.find((d) => d.low);
    expect(lowDay?.day).toBe(dueOn);
  });

  it('adds recurring income and subtracts recurring series debits on their days', () => {
    const days = forecast(
      baseInputs({
        series: [{ nextExpectedOn: nlDate('2026-01-05'), cadence: CADENCE.monthly, amountCents: cents(5000) }],
        incomeEvents: [{ firstExpectedOn: nlDate('2026-01-24'), amountCents: cents(250_000), cadence: CADENCE.monthly }],
      }),
    );
    const afterSeries = days.find((d) => d.day === '2026-01-05');
    const afterIncome = days.find((d) => d.day === '2026-01-24');
    expect(afterSeries?.balanceCents).toBe(495_000);
    expect(afterIncome?.balanceCents).toBe(745_000);
  });

  it('includes pending transactions on their expected day', () => {
    const days = forecast(
      baseInputs({ pendingTransactions: [{ expectedOn: nlDate('2026-01-02'), direction: 'out', amountCents: cents(8000) }] }),
    );
    expect(days.find((d) => d.day === '2026-01-02')?.balanceCents).toBe(492_000);
  });
});
