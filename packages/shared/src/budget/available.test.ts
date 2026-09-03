import { describe, expect, it } from 'vitest';
import { cents } from '../money';
import { available, carryInto } from './available';
import { ROLLOVER_MODE, type BudgetLine, type RolloverMode } from './types';

function line(plannedCents: number, carriedInCents: number, actualCents: number, rolloverMode: RolloverMode): BudgetLine {
  return {
    group: 'vaste_lasten',
    plannedCents: cents(plannedCents),
    carriedInCents: cents(carriedInCents),
    actualCents: cents(actualCents),
    rolloverMode,
  };
}

describe('available', () => {
  it('is planned + carried_in − actual, and may be negative', () => {
    expect(available(line(10_000, 1000, 3000, ROLLOVER_MODE.none))).toBe(8000);
    expect(available(line(10_000, 0, 15_000, ROLLOVER_MODE.none))).toBe(-5000);
  });
});

describe('carryInto', () => {
  const next = line(0, 0, 0, ROLLOVER_MODE.none);

  it('carries nothing forward for rolloverMode none, even with a surplus', () => {
    expect(carryInto(next, line(10_000, 0, 4000, ROLLOVER_MODE.none))).toBe(0);
  });

  it('carries only a positive surplus for carry_surplus, flooring a deficit at 0', () => {
    expect(carryInto(next, line(10_000, 0, 4000, ROLLOVER_MODE.carrySurplus))).toBe(6000);
    expect(carryInto(next, line(10_000, 0, 15_000, ROLLOVER_MODE.carrySurplus))).toBe(0);
  });

  it('carries the full amount for carry_all, including a negative deficit', () => {
    expect(carryInto(next, line(10_000, 0, 4000, ROLLOVER_MODE.carryAll))).toBe(6000);
    expect(carryInto(next, line(10_000, 0, 15_000, ROLLOVER_MODE.carryAll))).toBe(-5000);
  });

  it('propagates a carry_all deficit exactly once when rolled again, not twice', () => {
    // Period 1: planned 100, actual 150 -> available -50, carried into period 2.
    const period1 = line(10_000, 0, 15_000, ROLLOVER_MODE.carryAll);
    const carriedIntoPeriod2 = carryInto(next, period1);
    expect(carriedIntoPeriod2).toBe(-5000);

    // Period 2 starts with that -50 carried in and nothing spent yet -> its own available
    // reflects the deficit exactly once, not doubled.
    const period2 = line(10_000, carriedIntoPeriod2, 0, ROLLOVER_MODE.carryAll);
    expect(available(period2)).toBe(5000);
    expect(carryInto(next, period2)).toBe(5000);
  });

  it('is idempotent: rolling the same prev line twice yields the same carried amount', () => {
    const prev = line(10_000, 2000, 4000, ROLLOVER_MODE.carrySurplus);
    expect(carryInto(next, prev)).toBe(carryInto(next, prev));
  });

  it('throws for an unknown rollover mode', () => {
    const invalid = line(10_000, 0, 4000, 'weekly' as unknown as RolloverMode);
    expect(() => carryInto(next, invalid)).toThrow(/unknown rollover mode/);
  });
});
