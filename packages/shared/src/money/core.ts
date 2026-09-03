import { MONEY_TEXT, type Cents } from './types';

/* ── Types ────────────────────────────────────────────── */
// (no additional types beyond ./types)

/* ── Implementation ───────────────────────────────────── */

/** Constructs a branded `Cents` value. Throws if `value` is not an integer — money is never fractional cents. */
export function cents(value: number): Cents {
  if (!Number.isInteger(value)) {
    throw new RangeError(MONEY_TEXT.notInteger);
  }
  return value as Cents;
}

export function add(a: Cents, b: Cents): Cents {
  return cents(a + b);
}

export function sub(a: Cents, b: Cents): Cents {
  return cents(a - b);
}

/** Scales an amount by an arbitrary factor (e.g. `0.08` for the vakantiegeld minimum), rounding to the nearest cent. */
export function mul(a: Cents, factor: number): Cents {
  return cents(Math.round(a * factor));
}

/** Takes `percent` percent of `a` (e.g. `pct(cents(10_000), 8)` → 8% of €100.00), rounding to the nearest cent. */
export function pct(a: Cents, percent: number): Cents {
  return mul(a, percent / 100);
}

/** Rounds `value` (a possibly-fractional number of cents) up to the next multiple of `toCents`. */
export function ceilTo(value: number, toCents: number): Cents {
  return cents(Math.ceil(value / toCents) * toCents);
}

/** Rounds `value` (a possibly-fractional number of cents) down to the previous multiple of `toCents`. */
export function floorTo(value: number, toCents: number): Cents {
  return cents(Math.floor(value / toCents) * toCents);
}

export function sum(values: readonly Cents[]): Cents {
  return cents(values.reduce((total, v) => total + v, 0));
}

/**
 * Clamps `value` between `min` and `max`, inclusive. Generic over any branded numeric type
 * (`Cents`, a plain ratio, …) so the brand survives the round trip — `docs/10` §4.3 clamps a
 * plain 0..1 ratio, not an amount of money.
 */
export function clamp<T extends number>(value: T, min: T, max: T): T {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
