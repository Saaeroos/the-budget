import { describe, expect, it } from 'vitest';
import { cents } from '../money';
import { estimateVakantiegeld } from './vakantiegeld';

describe('estimateVakantiegeld', () => {
  it('estimates 8% of gross annual pay (docs/10 §9)', () => {
    expect(estimateVakantiegeld(cents(4_000_000))).toBe(320_000);
  });

  it('rounds to the nearest cent', () => {
    expect(estimateVakantiegeld(cents(101))).toBe(8);
  });

  it('is 0 for 0 gross annual pay', () => {
    expect(estimateVakantiegeld(cents(0))).toBe(0);
  });
});
