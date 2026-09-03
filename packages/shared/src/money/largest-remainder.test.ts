import { describe, expect, it } from 'vitest';
import { cents } from './core';
import { largestRemainder } from './largest-remainder';

describe('largestRemainder', () => {
  it('splits €100 across 3 equal members as 33.34 / 33.33 / 33.33', () => {
    const total = cents(10_000);
    const shares = [
      { id: 'a', value: 10_000 / 3 },
      { id: 'b', value: 10_000 / 3 },
      { id: 'c', value: 10_000 / 3 },
    ];
    const result = largestRemainder(shares, total);
    expect(result.get('a')).toBe(3334);
    expect(result.get('b')).toBe(3333);
    expect(result.get('c')).toBe(3333);
    expect([...result.values()].reduce((a, b) => a + b, 0)).toBe(10_000);
  });

  it('returns an empty map for no shares', () => {
    expect(largestRemainder([], cents(1000)).size).toBe(0);
  });

  it('distributes zero remainder cents evenly when the split is exact', () => {
    const result = largestRemainder(
      [
        { id: 'a', value: 50_00 },
        { id: 'b', value: 50_00 },
      ],
      cents(10_000),
    );
    expect(result.get('a')).toBe(5000);
    expect(result.get('b')).toBe(5000);
  });

  it('breaks ties by original order when fractions are equal', () => {
    const result = largestRemainder(
      [
        { id: 'a', value: 33.5 },
        { id: 'b', value: 33.5 },
        { id: 'c', value: 33.5 },
      ],
      cents(101),
    );
    // sum of floors = 99, 2 cents to distribute -> first two entries in order win the tie
    expect(result.get('a')).toBe(34);
    expect(result.get('b')).toBe(34);
    expect(result.get('c')).toBe(33);
  });

  it('assigns nothing extra when floors already exceed the total (defensive)', () => {
    const result = largestRemainder(
      [
        { id: 'a', value: 60 },
        { id: 'b', value: 60 },
      ],
      cents(100),
    );
    expect(result.get('a')).toBe(60);
    expect(result.get('b')).toBe(60);
  });
});
