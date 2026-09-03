import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, eachDay } from './arithmetic';
import { nlDate } from './nl-date';

describe('addDays', () => {
  it('adds days within a month', () => {
    expect(addDays(nlDate('2026-09-01'), 2)).toBe('2026-09-03');
  });

  it('rolls over a month boundary', () => {
    expect(addDays(nlDate('2026-01-31'), 1)).toBe('2026-02-01');
  });

  it('subtracts days with a negative amount', () => {
    expect(addDays(nlDate('2026-03-01'), -1)).toBe('2026-02-28');
  });

  it('is stable across a DST spring-forward boundary (Europe/Amsterdam, last Sunday of March)', () => {
    // 2026-03-29 is the NL DST spring-forward date.
    expect(addDays(nlDate('2026-03-28'), 1)).toBe('2026-03-29');
    expect(addDays(nlDate('2026-03-29'), 1)).toBe('2026-03-30');
  });

  it('is stable across a DST fall-back boundary (last Sunday of October)', () => {
    // 2026-10-25 is the NL DST fall-back date.
    expect(addDays(nlDate('2026-10-24'), 1)).toBe('2026-10-25');
    expect(addDays(nlDate('2026-10-25'), 1)).toBe('2026-10-26');
  });
});

describe('daysBetween', () => {
  it('counts zero for the same date', () => {
    expect(daysBetween(nlDate('2026-09-01'), nlDate('2026-09-01'))).toBe(0);
  });

  it('counts forward across a month boundary', () => {
    expect(daysBetween(nlDate('2026-01-30'), nlDate('2026-02-01'))).toBe(2);
  });

  it('counts negative when `to` precedes `from`', () => {
    expect(daysBetween(nlDate('2026-02-01'), nlDate('2026-01-30'))).toBe(-2);
  });

  it('counts exactly 1 day across the DST spring-forward boundary', () => {
    expect(daysBetween(nlDate('2026-03-29'), nlDate('2026-03-30'))).toBe(1);
  });

  it('counts exactly 1 day across the DST fall-back boundary', () => {
    expect(daysBetween(nlDate('2026-10-25'), nlDate('2026-10-26'))).toBe(1);
  });
});

describe('eachDay', () => {
  it('returns the requested number of consecutive dates starting at start', () => {
    const days = eachDay(nlDate('2026-09-01'), 3);
    expect(days).toEqual(['2026-09-01', '2026-09-02', '2026-09-03']);
  });

  it('returns exactly 90 days for a 90-day forecast window', () => {
    const days = eachDay(nlDate('2026-01-01'), 90);
    expect(days).toHaveLength(90);
    expect(days[89]).toBe(addDays(nlDate('2026-01-01'), 89));
  });

  it('returns an empty array for a count of zero', () => {
    expect(eachDay(nlDate('2026-09-01'), 0)).toEqual([]);
  });
});
