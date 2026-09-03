import { add, cents, sub, type Cents } from '../money';
import { ROLLOVER_MODE, type BudgetLine } from './types';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = { unknownRolloverMode: 'carryInto: unknown rollover mode' } as const;

/* ── Types ────────────────────────────────────────────── */
// (BudgetLine lives in ./types)

/* ── Implementation ───────────────────────────────────── */

/** `planned + carried_in − actual` — may be negative; over-budget is a separate figure, never a negative bar (`docs/10` §3.3). */
export function available(line: BudgetLine): Cents {
  return sub(add(line.plannedCents, line.carriedInCents), line.actualCents);
}

/**
 * The amount carried into the next period from `prev`, per `prev.rolloverMode`
 * (`docs/10` §3.4). `next` is part of the call-site shape (`carryInto(nextLine, prevLine)`
 * in the spec) but the amount depends only on `prev` — the target line the money lands in
 * is chosen by the caller, not by this pure calculation.
 */
export function carryInto(_next: BudgetLine, prev: BudgetLine): Cents {
  const avail = available(prev);
  switch (prev.rolloverMode) {
    case ROLLOVER_MODE.none:
      return cents(0);
    case ROLLOVER_MODE.carrySurplus:
      return cents(Math.max(0, avail));
    case ROLLOVER_MODE.carryAll:
      return avail;
    default: {
      const exhaustive: never = prev.rolloverMode;
      throw new RangeError(`${TEXT.unknownRolloverMode} ${String(exhaustive)}`);
    }
  }
}
