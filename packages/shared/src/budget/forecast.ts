import { addDays, eachDay, type NLDate } from '../dates';
import { cents, type Cents } from '../money';
import {
  expandIncome,
  expandObligations,
  expandSeries,
  pendingForecastEvents,
  type ForecastWindow,
  type IncomeForecastInput,
  type ObligationDueInput,
  type PendingForecastTransaction,
  type RecurringSeriesInput,
} from './forecast-events';
import { trailingMedianDailySpend, type SpendTransaction } from './trailing-median';
import { CATEGORY_GROUP } from './types';

/* ── Types ────────────────────────────────────────────── */
export interface ForecastInputs {
  readonly today: NLDate;
  /** Today's liquid balance — the forecast's starting point (`docs/10` §6). */
  readonly startingBalanceCents: Cents;
  readonly series: readonly RecurringSeriesInput[];
  readonly obligations: readonly ObligationDueInput[];
  readonly incomeEvents: readonly IncomeForecastInput[];
  readonly pendingTransactions: readonly PendingForecastTransaction[];
  /** All transactions needed to compute `trailingMedianDailySpend` for huishoudelijk. */
  readonly spendTransactions: readonly SpendTransaction[];
  readonly bufferCents: Cents;
}

export interface DayPoint {
  readonly day: NLDate;
  readonly balanceCents: Cents;
  readonly low: boolean;
}

/* ── Implementation ───────────────────────────────────── */

const LIMITS = {
  forecastDays: 90,
  trailingMedianWindowDays: 90,
} as const;

/**
 * Projects the household's liquid balance forward 90 days (`docs/10` §6): known events
 * (recurring series, obligations, income, pending transactions) land on their exact
 * days, and every day also loses the trailing median daily huishoudelijk spend, so the
 * projection reflects ordinary variable spending too, not just known bills.
 */
export function forecast(inputs: ForecastInputs): readonly DayPoint[] {
  const window: ForecastWindow = { startsOn: inputs.today, endsOn: addDays(inputs.today, LIMITS.forecastDays - 1) };
  const events = [
    ...expandSeries(inputs.series, window),
    ...expandObligations(inputs.obligations, window),
    ...expandIncome(inputs.incomeEvents, window),
    ...pendingForecastEvents(inputs.pendingTransactions, window),
  ];

  const dailyVariable = trailingMedianDailySpend(
    inputs.spendTransactions,
    { endsOn: addDays(inputs.today, -1), days: LIMITS.trailingMedianWindowDays },
    CATEGORY_GROUP.household,
  );

  let balance = inputs.startingBalanceCents;
  return eachDay(inputs.today, LIMITS.forecastDays).map((day) => {
    balance = cents(balance - dailyVariable);
    for (const event of events) {
      if (event.day === day) balance = cents(balance + event.signedAmountCents);
    }
    return { day, balanceCents: balance, low: balance < inputs.bufferCents };
  });
}
