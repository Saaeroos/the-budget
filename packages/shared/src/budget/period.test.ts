import { describe, expect, it } from 'vitest';
import { nlDate } from '../dates';
import { closePeriodOnKindChange, periodFor, periodsBetween } from './period';
import { PERIOD_KIND, type HouseholdPeriodConfig } from './types';

describe('periodFor — calendar_month', () => {
  const cfg: HouseholdPeriodConfig = { kind: PERIOD_KIND.calendarMonth };

  it('spans the 1st to the last day of a 31-day month', () => {
    const p = periodFor(nlDate('2026-03-15'), cfg);
    expect(p).toEqual({ kind: 'calendar_month', startsOn: '2026-03-01', endsOn: '2026-03-31', label: 'maart 2026' });
  });

  it('spans a 30-day month correctly', () => {
    const p = periodFor(nlDate('2026-04-01'), cfg);
    expect(p.startsOn).toBe('2026-04-01');
    expect(p.endsOn).toBe('2026-04-30');
  });

  it('spans February in a non-leap year (28 days)', () => {
    const p = periodFor(nlDate('2026-02-10'), cfg);
    expect(p.endsOn).toBe('2026-02-28');
  });

  it('spans February in a leap year (29 days)', () => {
    const p = periodFor(nlDate('2028-02-10'), cfg);
    expect(p.endsOn).toBe('2028-02-29');
  });
});

describe('periodFor — custom_month', () => {
  it('anchors on the 24th, matching the docs/10 §1 example label', () => {
    const cfg: HouseholdPeriodConfig = { kind: PERIOD_KIND.customMonth, anchorDay: 24 };
    const p = periodFor(nlDate('2027-04-01'), cfg);
    expect(p).toEqual({ kind: 'custom_month', startsOn: '2027-03-24', endsOn: '2027-04-23', label: '24 mrt – 23 apr' });
  });

  it('places a date exactly on the anchor day at the start of a period', () => {
    const cfg: HouseholdPeriodConfig = { kind: PERIOD_KIND.customMonth, anchorDay: 24 };
    const p = periodFor(nlDate('2027-03-24'), cfg);
    expect(p.startsOn).toBe('2027-03-24');
  });

  it('places a date the day before the anchor at the end of the previous period', () => {
    const cfg: HouseholdPeriodConfig = { kind: PERIOD_KIND.customMonth, anchorDay: 24 };
    const p = periodFor(nlDate('2027-03-23'), cfg);
    expect(p.endsOn).toBe('2027-03-23');
    expect(p.startsOn).toBe('2027-02-24');
  });

  it('clamps an anchor of 31 in a non-leap February to 28, with no gap or overlap', () => {
    const cfg: HouseholdPeriodConfig = { kind: PERIOD_KIND.customMonth, anchorDay: 31 };
    const januaryPeriod = periodFor(nlDate('2026-02-01'), cfg);
    expect(januaryPeriod).toEqual({ kind: 'custom_month', startsOn: '2026-01-31', endsOn: '2026-02-27', label: '31 jan – 27 feb' });
    const februaryPeriod = periodFor(nlDate('2026-02-28'), cfg);
    expect(februaryPeriod.startsOn).toBe('2026-02-28'); // the day right after the previous period's end — no gap
    expect(februaryPeriod.endsOn).toBe('2026-03-30');
  });

  it('clamps an anchor of 31 in a leap February to 29, with no gap or overlap', () => {
    const cfg: HouseholdPeriodConfig = { kind: PERIOD_KIND.customMonth, anchorDay: 31 };
    const period = periodFor(nlDate('2028-02-15'), cfg);
    expect(period.startsOn).toBe('2028-01-31');
    expect(period.endsOn).toBe('2028-02-28'); // day before the clamped 29th
    const nextPeriod = periodFor(nlDate('2028-02-29'), cfg);
    expect(nextPeriod.startsOn).toBe('2028-02-29'); // no gap after the previous period's end
  });

  it('defaults the anchor day to 1 when omitted, matching calendar_month bounds', () => {
    const cfg: HouseholdPeriodConfig = { kind: PERIOD_KIND.customMonth };
    const p = periodFor(nlDate('2026-06-15'), cfg);
    expect(p.startsOn).toBe('2026-06-01');
    expect(p.endsOn).toBe('2026-06-30');
  });
});

describe('periodFor — four_weeks', () => {
  it('produces a 28-day window from the anchor date', () => {
    const cfg: HouseholdPeriodConfig = { kind: PERIOD_KIND.fourWeeks, anchorDate: nlDate('2027-01-01') };
    const p = periodFor(nlDate('2027-01-01'), cfg);
    expect(p).toEqual({ kind: 'four_weeks', startsOn: '2027-01-01', endsOn: '2027-01-28', label: 'periode 1 · 2027' });
  });

  it('numbers the second 28-day window as period 2', () => {
    const cfg: HouseholdPeriodConfig = { kind: PERIOD_KIND.fourWeeks, anchorDate: nlDate('2027-01-01') };
    const p = periodFor(nlDate('2027-01-29'), cfg);
    expect(p).toEqual({ kind: 'four_weeks', startsOn: '2027-01-29', endsOn: '2027-02-25', label: 'periode 2 · 2027' });
  });

  it('wraps back to period 1 after the 13th period of the cycle', () => {
    const cfg: HouseholdPeriodConfig = { kind: PERIOD_KIND.fourWeeks, anchorDate: nlDate('2027-01-01') };
    // 13 periods * 28 days = 364 days after the anchor.
    const p = periodFor(nlDate('2027-12-31'), cfg);
    expect(p.label.startsWith('periode 1')).toBe(true);
  });

  it('handles a date before the anchor date with a negative period index', () => {
    const cfg: HouseholdPeriodConfig = { kind: PERIOD_KIND.fourWeeks, anchorDate: nlDate('2027-01-29') };
    const p = periodFor(nlDate('2027-01-01'), cfg);
    expect(p.startsOn).toBe('2027-01-01');
    expect(p.endsOn).toBe('2027-01-28');
  });

  it('defaults the anchor date to the queried date when omitted', () => {
    const cfg: HouseholdPeriodConfig = { kind: PERIOD_KIND.fourWeeks };
    const p = periodFor(nlDate('2027-05-01'), cfg);
    expect(p.startsOn).toBe('2027-05-01');
  });
});

describe('periodFor — unknown kind', () => {
  it('throws for a kind outside the known union', () => {
    const cfg = { kind: 'weekly' } as unknown as HouseholdPeriodConfig;
    expect(() => periodFor(nlDate('2026-01-01'), cfg)).toThrow(/unknown period kind/);
  });
});

describe('closePeriodOnKindChange', () => {
  it('truncates the period to end on the change date, keeping the rest unchanged', () => {
    const cfg: HouseholdPeriodConfig = { kind: PERIOD_KIND.calendarMonth };
    const period = periodFor(nlDate('2026-03-15'), cfg);
    const closed = closePeriodOnKindChange(period, nlDate('2026-03-20'));
    expect(closed).toEqual({ ...period, endsOn: '2026-03-20' });
  });
});

describe('periodsBetween', () => {
  const cfg: HouseholdPeriodConfig = { kind: PERIOD_KIND.calendarMonth };

  it('returns 1 when both dates fall in the same period', () => {
    expect(periodsBetween(nlDate('2026-03-01'), nlDate('2026-03-20'), cfg)).toBe(1);
  });

  it('returns 1 when the target date is in the past', () => {
    expect(periodsBetween(nlDate('2026-03-15'), nlDate('2026-01-01'), cfg)).toBe(1);
  });

  it('counts multiple periods forward', () => {
    expect(periodsBetween(nlDate('2026-01-15'), nlDate('2026-03-15'), cfg)).toBe(3);
  });
});

describe('period kind change mid-period (docs/10 §1, §11)', () => {
  it('closes the old period on the change date and starts the new kind the next day, with history intact', () => {
    const oldCfg: HouseholdPeriodConfig = { kind: PERIOD_KIND.calendarMonth };
    const openPeriod = periodFor(nlDate('2026-06-10'), oldCfg);
    const changeDate = nlDate('2026-06-15');
    const closed = closePeriodOnKindChange(openPeriod, changeDate);
    expect(closed.startsOn).toBe('2026-06-01');
    expect(closed.endsOn).toBe('2026-06-15');

    const newCfg: HouseholdPeriodConfig = { kind: PERIOD_KIND.fourWeeks, anchorDate: nlDate('2026-06-16') };
    const nextPeriod = periodFor(nlDate('2026-06-16'), newCfg);
    expect(nextPeriod.startsOn).toBe('2026-06-16');
    expect(nextPeriod.kind).toBe('four_weeks');
  });
});
