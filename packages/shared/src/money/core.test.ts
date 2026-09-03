import { describe, expect, it } from 'vitest';
import { add, ceilTo, clamp, cents, floorTo, mul, pct, sub, sum } from './core';

describe('cents', () => {
  it('brands an integer number of cents', () => {
    expect(cents(1250)).toBe(1250);
  });

  it('throws for a fractional value', () => {
    expect(() => cents(12.5)).toThrow(/integer/);
  });
});

describe('add', () => {
  it('adds two amounts', () => {
    expect(add(cents(100), cents(50))).toBe(150);
  });
});

describe('sub', () => {
  it('subtracts one amount from another, allowing a negative result', () => {
    expect(sub(cents(50), cents(100))).toBe(-50);
  });
});

describe('mul', () => {
  it('scales an amount by a factor, rounding half up', () => {
    expect(mul(cents(10_000), 0.08)).toBe(800);
  });

  it('rounds .5 cents up', () => {
    expect(mul(cents(1), 0.5)).toBe(1);
  });
});

describe('pct', () => {
  it('takes a percentage of an amount', () => {
    expect(pct(cents(10_000), 8)).toBe(800);
  });

  it('handles 0%', () => {
    expect(pct(cents(10_000), 0)).toBe(0);
  });
});

describe('ceilTo', () => {
  it('rounds up to the next multiple', () => {
    expect(ceilTo(101, 100)).toBe(200);
  });

  it('leaves an exact multiple unchanged', () => {
    expect(ceilTo(200, 100)).toBe(200);
  });
});

describe('floorTo', () => {
  it('rounds down to the previous multiple', () => {
    expect(floorTo(199, 100)).toBe(100);
  });

  it('leaves an exact multiple unchanged', () => {
    expect(floorTo(200, 100)).toBe(200);
  });
});

describe('sum', () => {
  it('sums an array of amounts', () => {
    expect(sum([cents(100), cents(200), cents(-50)])).toBe(250);
  });

  it('sums an empty array to zero', () => {
    expect(sum([])).toBe(0);
  });
});

describe('clamp', () => {
  it('returns the value when inside the range', () => {
    expect(clamp(cents(50), cents(0), cents(100))).toBe(50);
  });

  it('clamps to the minimum', () => {
    expect(clamp(cents(-10), cents(0), cents(100))).toBe(0);
  });

  it('clamps to the maximum', () => {
    expect(clamp(cents(150), cents(0), cents(100))).toBe(100);
  });

  it('clamps a plain ratio, not just Cents', () => {
    expect(clamp(1.5, 0, 1)).toBe(1);
  });
});
