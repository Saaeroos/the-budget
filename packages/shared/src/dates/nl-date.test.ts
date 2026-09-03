import { describe, expect, it } from 'vitest';
import { nlDate, nlDateFromJsDate, parseNLDate } from './nl-date';

describe('nlDate', () => {
  it('brands a well-formed date string', () => {
    expect(nlDate('2026-09-03')).toBe('2026-09-03');
  });

  it('rejects a string that is not YYYY-MM-DD shaped', () => {
    expect(() => nlDate('03-09-2026')).toThrow(/YYYY-MM-DD/);
  });

  it('rejects a calendar-invalid date instead of silently rolling it over', () => {
    expect(() => nlDate('2026-02-30')).toThrow(/YYYY-MM-DD/);
  });

  it('accepts the last day of February in a leap year', () => {
    expect(nlDate('2028-02-29')).toBe('2028-02-29');
  });

  it('rejects 29 February in a non-leap year', () => {
    expect(() => nlDate('2026-02-29')).toThrow();
  });
});

describe('parseNLDate', () => {
  it('parses the branded string into a Date at local midnight on that day', () => {
    const parsed = parseNLDate(nlDate('2026-09-03'));
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(8);
    expect(parsed.getDate()).toBe(3);
    expect(parsed.getHours()).toBe(0);
  });
});

describe('nlDateFromJsDate', () => {
  it('round-trips through parseNLDate', () => {
    const original = nlDate('2026-01-05');
    expect(nlDateFromJsDate(parseNLDate(original))).toBe(original);
  });

  it('pads single-digit month and day', () => {
    expect(nlDateFromJsDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
