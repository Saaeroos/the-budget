import { describe, expect, it } from 'vitest';
import { nlDate } from '../dates';
import { cents } from '../money';
import { behindBy, expectedByNow, monthlyContribution, recycle } from './envelope';
import { CADENCE, PERIOD_KIND, type Envelope, type EnvelopeWithTarget, type HouseholdPeriodConfig } from './types';

const cfg: HouseholdPeriodConfig = { kind: PERIOD_KIND.calendarMonth };

function envelope(overrides: Partial<Envelope> = {}): Envelope {
  return {
    monthlyContributionCents: null,
    targetCents: cents(120_000),
    savedCents: cents(0),
    targetDate: null,
    startedOn: nlDate('2026-01-01'),
    ...overrides,
  };
}

describe('monthlyContribution', () => {
  it('always uses the user override when set, ignoring the target math', () => {
    const e = envelope({ monthlyContributionCents: cents(5000), targetDate: nlDate('2026-12-01') });
    expect(monthlyContribution(e, nlDate('2026-01-01'), cfg)).toBe(5000);
  });

  it('is 0 for an open-ended potje with no target date', () => {
    const e = envelope({ targetDate: null });
    expect(monthlyContribution(e, nlDate('2026-01-01'), cfg)).toBe(0);
  });

  it('divides the remaining amount across the periods left, rounding up to whole euros', () => {
    // 6 periods (Jan..Jun inclusive) to save 120000 -> 20000/period exactly.
    const e = envelope({ targetCents: cents(120_000), savedCents: cents(0), targetDate: nlDate('2026-06-15') });
    expect(monthlyContribution(e, nlDate('2026-01-15'), cfg)).toBe(20_000);
  });

  it('rounds up when the division is not exact', () => {
    // 3 periods, 10000 remaining -> 3333.33 -> ceil to whole euros -> 3400.
    const e = envelope({ targetCents: cents(10_000), savedCents: cents(0), targetDate: nlDate('2026-03-15') });
    expect(monthlyContribution(e, nlDate('2026-01-15'), cfg)).toBe(3400);
  });

  it('is 0 once the target has already been reached, retaining the surplus', () => {
    const e = envelope({ targetCents: cents(10_000), savedCents: cents(15_000), targetDate: nlDate('2026-06-01') });
    expect(monthlyContribution(e, nlDate('2026-01-01'), cfg)).toBe(0);
  });

  it('requires the full remaining amount in one go when the target date is already in the past', () => {
    const e = envelope({ targetCents: cents(10_000), savedCents: cents(4000), targetDate: nlDate('2026-01-01') });
    expect(monthlyContribution(e, nlDate('2026-06-15'), cfg)).toBe(6000);
  });
});

function envelopeWithTarget(overrides: Partial<EnvelopeWithTarget> = {}): EnvelopeWithTarget {
  return {
    monthlyContributionCents: null,
    targetCents: cents(120_000),
    savedCents: cents(0),
    startedOn: nlDate('2026-01-01'),
    targetDate: nlDate('2026-12-01'),
    ...overrides,
  };
}

describe('expectedByNow', () => {
  it('is a linear fraction of the target based on periods elapsed vs total', () => {
    // Jan..Dec = 12 periods total; by 15 Mar, 3 periods elapsed -> 3/12 of target.
    const e = envelopeWithTarget({ targetCents: cents(120_000) });
    expect(expectedByNow(e, nlDate('2026-03-15'), cfg)).toBe(30_000);
  });

  it('clamps to the full target once elapsed periods exceed the total', () => {
    const e = envelopeWithTarget({ targetCents: cents(120_000), targetDate: nlDate('2026-02-01') });
    expect(expectedByNow(e, nlDate('2026-12-01'), cfg)).toBe(120_000);
  });
});

describe('behindBy', () => {
  it('is the shortfall between the linear expectation and what is actually saved', () => {
    const e = envelopeWithTarget({ targetCents: cents(120_000), savedCents: cents(10_000) });
    expect(behindBy(e, nlDate('2026-03-15'), cfg)).toBe(20_000); // expected 30000, saved 10000
  });

  it('is 0, never negative, when saved is at or ahead of the linear expectation', () => {
    const e = envelopeWithTarget({ targetCents: cents(120_000), savedCents: cents(90_000) });
    expect(behindBy(e, nlDate('2026-03-15'), cfg)).toBe(0);
  });
});

describe('recycle', () => {
  it('withdraws the spent amount and advances the target date by the cadence', () => {
    const e = envelopeWithTarget({ savedCents: cents(50_000), targetDate: nlDate('2026-12-01') });
    const recycled = recycle(e, cents(45_000), CADENCE.yearly);
    expect(recycled.savedCents).toBe(5000);
    expect(recycled.targetDate).toBe('2027-12-01');
  });

  it('floors savedCents at 0 when spent exceeds what was saved', () => {
    const e = envelopeWithTarget({ savedCents: cents(10_000), targetDate: nlDate('2026-12-01') });
    const recycled = recycle(e, cents(15_000), CADENCE.yearly);
    expect(recycled.savedCents).toBe(0);
  });
});
