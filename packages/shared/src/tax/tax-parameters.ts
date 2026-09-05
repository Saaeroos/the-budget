import { cents } from '../money';
import type { TaxParams } from './types';

/* ── Text ─────────────────────────────────────────────── */
export const TAX_PARAMS_TEXT = {
  unknownYear: 'tax.params: no tax parameters available for year',
} as const;

/* ── Types ────────────────────────────────────────────── */
// (types defined in ./types)

/* ── Implementation ───────────────────────────────────── */

export const TAX_PARAMS_2026: TaxParams = {
  year: 2026,
  zelfstandigenaftrekCents: cents(503000), // € 5.030
  startersaftrekCents: cents(212300), // € 2.123
  mkbVrijstellingBps: 1270, // 12,70%
  schijf1UpperCents: cents(3844100), // € 38.441
  schijf1RateBps: 3697, // 36,97%
  schijf2RateBps: 4950, // 49,50%
  algHeffingskortingMaxCents: cents(336200), // € 3.362
  arbeidskortingMaxCents: cents(553200), // € 5.532
  box3VrijstellingCents: cents(5700000), // € 57.000
  korDrempelCents: cents(2000000), // € 20.000
} as const;

export const TAX_PARAMS_2025: TaxParams = {
  year: 2025,
  zelfstandigenaftrekCents: cents(247000), // € 2.470
  startersaftrekCents: cents(212300), // € 2.123
  mkbVrijstellingBps: 1270, // 12,70%
  schijf1UpperCents: cents(3844100),
  schijf1RateBps: 3697,
  schijf2RateBps: 4950,
  algHeffingskortingMaxCents: cents(336200),
  arbeidskortingMaxCents: cents(553200),
  box3VrijstellingCents: cents(5700000),
  korDrempelCents: cents(2000000),
} as const;

const TAX_PARAMS_MAP: Readonly<Record<number, TaxParams>> = {
  2025: TAX_PARAMS_2025,
  2026: TAX_PARAMS_2026,
};

/**
 * Returns tax parameters for a given year.
 * Defaults to 2026 parameters if the requested year is not explicitly registered.
 */
export function getTaxParams(year: number): TaxParams {
  const found = TAX_PARAMS_MAP[year];
  if (found) {
    return found;
  }
  // Fallback to closest modern parameters (2026) with overridden year
  return {
    ...TAX_PARAMS_2026,
    year,
  };
}
