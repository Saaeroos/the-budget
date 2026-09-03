import { describe, expect, it } from 'vitest';
import { nlDate } from '../dates';
import { addCadence } from './cadence';
import { CADENCE, type Cadence } from './types';

describe('addCadence', () => {
  it('advances weekly by 7 days', () => {
    expect(addCadence(nlDate('2026-09-01'), CADENCE.weekly)).toBe('2026-09-08');
  });

  it('advances four-weekly by 28 days', () => {
    expect(addCadence(nlDate('2026-09-01'), CADENCE.fourWeekly)).toBe('2026-09-29');
  });

  it('advances monthly by 1 calendar month', () => {
    expect(addCadence(nlDate('2026-01-31'), CADENCE.monthly)).toBe('2026-02-28');
  });

  it('advances bimonthly by 2 calendar months', () => {
    expect(addCadence(nlDate('2026-01-15'), CADENCE.bimonthly)).toBe('2026-03-15');
  });

  it('advances quarterly by 3 calendar months', () => {
    expect(addCadence(nlDate('2026-01-15'), CADENCE.quarterly)).toBe('2026-04-15');
  });

  it('advances half-yearly by 6 calendar months', () => {
    expect(addCadence(nlDate('2026-01-15'), CADENCE.halfYearly)).toBe('2026-07-15');
  });

  it('advances yearly by 12 calendar months', () => {
    expect(addCadence(nlDate('2026-01-15'), CADENCE.yearly)).toBe('2027-01-15');
  });

  it('leaves an irregular cadence unchanged', () => {
    expect(addCadence(nlDate('2026-01-15'), CADENCE.irregular)).toBe('2026-01-15');
  });

  it('throws for an unknown cadence value', () => {
    const invalid = 'fortnightly' as unknown as Cadence;
    expect(() => addCadence(nlDate('2026-01-15'), invalid)).toThrow(/unknown cadence/);
  });
});
