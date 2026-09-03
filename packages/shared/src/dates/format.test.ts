import { describe, expect, it } from 'vitest';
import { formatMonthLabel, formatNumeric, formatShort, formatWithWeekday } from './format';
import { nlDate } from './nl-date';

describe('formatShort', () => {
  it('formats day and abbreviated month with no trailing dot', () => {
    expect(formatShort(nlDate('2026-09-03'))).toBe('3 sep');
  });

  it('formats another month abbreviation without a dot', () => {
    expect(formatShort(nlDate('2026-03-24'))).toBe('24 mrt');
  });
});

describe('formatWithWeekday', () => {
  it('formats weekday, day and abbreviated month', () => {
    // 2026-09-01 is a Tuesday.
    expect(formatWithWeekday(nlDate('2026-09-01'))).toBe('di 1 sep');
  });
});

describe('formatNumeric', () => {
  it('formats as dd-MM-yyyy', () => {
    expect(formatNumeric(nlDate('2026-09-03'))).toBe('03-09-2026');
  });
});

describe('formatMonthLabel', () => {
  it('formats a lowercase month name and year', () => {
    expect(formatMonthLabel(nlDate('2026-09-15'))).toBe('september 2026');
  });

  it('lowercases March, whose Dutch name is otherwise a normal word', () => {
    expect(formatMonthLabel(nlDate('2027-03-01'))).toBe('maart 2027');
  });
});
