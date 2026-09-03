import { describe, expect, it } from 'vitest';
import { nlDate } from '../dates';
import { cents } from '../money';
import {
  expandIncome,
  expandObligations,
  expandSeries,
  pendingForecastEvents,
  type ForecastWindow,
} from './forecast-events';
import { CADENCE, TXN_DIRECTION } from './types';

const window: ForecastWindow = { startsOn: nlDate('2026-03-01'), endsOn: nlDate('2026-03-31') };

describe('expandSeries', () => {
  it('produces one event per cadence occurrence within the window as an outflow', () => {
    const events = expandSeries([{ nextExpectedOn: nlDate('2026-03-05'), cadence: CADENCE.weekly, amountCents: cents(1000) }], window);
    expect(events.map((e) => e.day)).toEqual(['2026-03-05', '2026-03-12', '2026-03-19', '2026-03-26']);
    expect(events.every((e) => e.signedAmountCents === -1000)).toBe(true);
  });

  it('excludes occurrences before the window starts', () => {
    const events = expandSeries([{ nextExpectedOn: nlDate('2026-02-20'), cadence: CADENCE.weekly, amountCents: cents(1000) }], window);
    expect(events.every((e) => e.day >= window.startsOn)).toBe(true);
    expect(events[0]?.day).toBe('2026-03-06');
  });

  it('contributes only its single known occurrence for an irregular cadence, never looping', () => {
    const events = expandSeries([{ nextExpectedOn: nlDate('2026-03-15'), cadence: CADENCE.irregular, amountCents: cents(2500) }], window);
    expect(events).toEqual([{ day: '2026-03-15', signedAmountCents: -2500 }]);
  });

  it('produces nothing when the single occurrence falls outside the window', () => {
    const events = expandSeries([{ nextExpectedOn: nlDate('2026-01-01'), cadence: CADENCE.irregular, amountCents: cents(2500) }], window);
    expect(events).toEqual([]);
  });
});

describe('expandObligations', () => {
  it('produces one outflow event per obligation due within the window', () => {
    const events = expandObligations(
      [
        { dueOn: nlDate('2026-03-10'), amountCents: cents(24_000) },
        { dueOn: nlDate('2026-04-10'), amountCents: cents(1000) },
      ],
      window,
    );
    expect(events).toEqual([{ day: '2026-03-10', signedAmountCents: -24_000 }]);
  });
});

describe('expandIncome', () => {
  it('produces recurring inflow events by cadence', () => {
    const events = expandIncome([{ firstExpectedOn: nlDate('2026-03-24'), amountCents: cents(250_000), cadence: CADENCE.monthly }], window);
    expect(events).toEqual([{ day: '2026-03-24', signedAmountCents: 250_000 }]);
  });
});

describe('pendingForecastEvents', () => {
  it('signs an inbound pending transaction positive', () => {
    const events = pendingForecastEvents([{ expectedOn: nlDate('2026-03-05'), direction: TXN_DIRECTION.in, amountCents: cents(4000) }], window);
    expect(events).toEqual([{ day: '2026-03-05', signedAmountCents: 4000 }]);
  });

  it('signs an outbound pending transaction negative', () => {
    const events = pendingForecastEvents([{ expectedOn: nlDate('2026-03-05'), direction: TXN_DIRECTION.out, amountCents: cents(8000) }], window);
    expect(events).toEqual([{ day: '2026-03-05', signedAmountCents: -8000 }]);
  });

  it('excludes a pending transaction expected outside the window', () => {
    const events = pendingForecastEvents([{ expectedOn: nlDate('2026-04-01'), direction: TXN_DIRECTION.out, amountCents: cents(8000) }], window);
    expect(events).toEqual([]);
  });
});
