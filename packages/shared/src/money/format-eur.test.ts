import { describe, expect, it } from 'vitest';
import { cents } from './core';
import { formatEUR } from './format-eur';

describe('formatEUR', () => {
  it('formats a large positive amount with thousands and decimals', () => {
    expect(formatEUR(cents(123_456))).toBe('€ 1.234,56');
  });

  it('formats a negative amount with U+2212, not a hyphen', () => {
    expect(formatEUR(cents(-4200))).toBe('−€ 42,00');
  });

  it('renders exactly zero without a leading minus', () => {
    expect(formatEUR(cents(0))).toBe('€ 0,00');
  });

  it('always shows two decimals by default, even on a whole euro', () => {
    expect(formatEUR(cents(4200))).toBe('€ 42,00');
  });

  it('hides the decimals on a whole euro when decimals is auto', () => {
    expect(formatEUR(cents(4200), { decimals: 'auto' })).toBe('€ 42');
  });

  it('still shows decimals in auto mode when the amount is not a whole euro', () => {
    expect(formatEUR(cents(4250), { decimals: 'auto' })).toBe('€ 42,50');
  });

  it('renders a negative whole euro in auto mode without decimals', () => {
    expect(formatEUR(cents(-4200), { decimals: 'auto' })).toBe('−€ 42');
  });

  it('uses the non-breaking space between the symbol and the digits', () => {
    expect(formatEUR(cents(100)).charAt(1)).toBe(' ');
  });
});
