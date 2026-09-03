import { describe, expect, it } from 'vitest';
import { cents } from '../money';
import { benchmark } from './benchmark';

describe('benchmark', () => {
  it('returns null when there is no reference for this category', () => {
    expect(benchmark(cents(52_000), null)).toBeNull();
  });

  it('compares actual to reference, computing delta and ratio', () => {
    const result = benchmark(cents(52_000), { amountCents: cents(48_000), sourceNote: 'Nibud 2026' });
    expect(result).toEqual({ reference: 48_000, delta: 4000, ratio: 52_000 / 48_000, source: 'Nibud 2026' });
  });

  it('reports a negative delta when actual is below the reference, with no judgement encoded', () => {
    const result = benchmark(cents(40_000), { amountCents: cents(48_000), sourceNote: 'Nibud 2026' });
    expect(result?.delta).toBe(-8000);
  });
});
