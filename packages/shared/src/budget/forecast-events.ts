import type { NLDate } from '../dates';
import { cents, type Cents } from '../money';
import { addCadence } from './cadence';
import { CADENCE, TXN_DIRECTION, type Cadence, type TxnDirection } from './types';

/* ── Types ────────────────────────────────────────────── */
export interface ForecastWindow {
  readonly startsOn: NLDate;
  readonly endsOn: NLDate;
}

export interface ForecastEvent {
  readonly day: NLDate;
  /** Positive for an inflow, negative for an outflow. */
  readonly signedAmountCents: Cents;
}

/** A recurring debit (`docs/06` §8's `recurring_series`) — always an outflow. */
export interface RecurringSeriesInput {
  readonly nextExpectedOn: NLDate;
  readonly cadence: Cadence;
  readonly amountCents: Cents;
}

/** One obligation or obligation instalment due date (`docs/06` §8) — always an outflow. */
export interface ObligationDueInput {
  readonly dueOn: NLDate;
  readonly amountCents: Cents;
}

/** A recurring income event (salary, toeslagen, kinderbijslag, vakantiegeld, …) — always an inflow. */
export interface IncomeForecastInput {
  readonly firstExpectedOn: NLDate;
  readonly amountCents: Cents;
  readonly cadence: Cadence;
}

export interface PendingForecastTransaction {
  readonly expectedOn: NLDate;
  readonly direction: TxnDirection;
  readonly amountCents: Cents;
}

/* ── Implementation ───────────────────────────────────── */

function isWithinWindow(day: NLDate, window: ForecastWindow): boolean {
  return day >= window.startsOn && day <= window.endsOn;
}

/**
 * Expands one recurring item into its occurrences inside `window`, stepping forward by
 * `cadence`. An `irregular` cadence has no defined interval, so it contributes at most
 * its one known date rather than looping forever.
 */
interface RecurringExpansion {
  readonly startOn: NLDate;
  readonly cadence: Cadence;
  readonly amountCents: Cents;
  readonly sign: 1 | -1;
  readonly window: ForecastWindow;
}

function expandRecurring({ startOn, cadence, amountCents, sign, window }: RecurringExpansion): ForecastEvent[] {
  const events: ForecastEvent[] = [];
  let occurrence = startOn;
  while (occurrence <= window.endsOn) {
    if (isWithinWindow(occurrence, window)) {
      events.push({ day: occurrence, signedAmountCents: cents(sign * amountCents) });
    }
    if (cadence === CADENCE.irregular) break;
    occurrence = addCadence(occurrence, cadence);
  }
  return events;
}

export function expandSeries(series: readonly RecurringSeriesInput[], window: ForecastWindow): ForecastEvent[] {
  return series.flatMap((s) =>
    expandRecurring({ startOn: s.nextExpectedOn, cadence: s.cadence, amountCents: s.amountCents, sign: -1, window }),
  );
}

export function expandObligations(obligations: readonly ObligationDueInput[], window: ForecastWindow): ForecastEvent[] {
  return obligations
    .filter((o) => isWithinWindow(o.dueOn, window))
    .map((o) => ({ day: o.dueOn, signedAmountCents: cents(-o.amountCents) }));
}

export function expandIncome(incomeEvents: readonly IncomeForecastInput[], window: ForecastWindow): ForecastEvent[] {
  return incomeEvents.flatMap((i) =>
    expandRecurring({ startOn: i.firstExpectedOn, cadence: i.cadence, amountCents: i.amountCents, sign: 1, window }),
  );
}

export function pendingForecastEvents(transactions: readonly PendingForecastTransaction[], window: ForecastWindow): ForecastEvent[] {
  return transactions
    .filter((t) => isWithinWindow(t.expectedOn, window))
    .map((t) => ({
      day: t.expectedOn,
      signedAmountCents: cents(t.direction === TXN_DIRECTION.in ? t.amountCents : -t.amountCents),
    }));
}
