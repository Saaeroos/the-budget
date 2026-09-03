import { describe, expect, it } from 'vitest';
import { nlDate } from './nl-date';
import { weekNumber } from './week';

describe('weekNumber', () => {
  it('matches the docs/15 §1 example: week 36', () => {
    expect(weekNumber(nlDate('2026-09-03'))).toBe(36);
  });

  it('assigns 1 January to the final ISO week of the previous year when applicable', () => {
    expect(weekNumber(nlDate('2027-01-01'))).toBe(53);
  });

  it('assigns 31 December to week 1 of the next year when applicable', () => {
    expect(weekNumber(nlDate('2029-12-31'))).toBe(1);
  });
});
