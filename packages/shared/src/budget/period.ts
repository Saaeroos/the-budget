import { getDaysInMonth } from 'date-fns';
import { addDays, daysBetween, formatMonthLabel, formatShort, nlDateFromJsDate, parseNLDate, type NLDate } from '../dates';
import { PERIOD_KIND, type HouseholdPeriodConfig, type Period, type PeriodKind } from './types';

/* ── Text ─────────────────────────────────────────────── */
// `periode`, `enDash` and `middleDot` are literal formatting characters, not i18n keys —
// see docs/DECISIONS.md, 2026-09-03 "speech/period-label words" (same rationale as
// money/format-speech.ts). `unknownPeriodKind` is a dev-facing error message.
const TEXT = {
  periode: 'periode',
  enDash: '–',
  middleDot: '·',
  unknownPeriodKind: 'periodFor: unknown period kind',
} as const;

/* ── Types ────────────────────────────────────────────── */
// (Period, PeriodKind, HouseholdPeriodConfig live in ./types)

const LIMITS = {
  daysPerFourWeekPeriod: 28,
  fourWeekPeriodsPerYear: 13,
} as const;

/* ── Implementation ───────────────────────────────────── */

function daysInMonth(year: number, monthIndex: number): number {
  return getDaysInMonth(new Date(year, monthIndex, 1));
}

/** The anchor day for (year, monthIndex), clamped to that month's length (`docs/10` §1, §11). */
function clampedAnchor(year: number, monthIndex: number, anchorDay: number): Date {
  const day = Math.min(anchorDay, daysInMonth(year, monthIndex));
  return new Date(year, monthIndex, day);
}

function calendarMonthPeriod(date: NLDate): Period {
  const target = parseNLDate(date);
  const start = new Date(target.getFullYear(), target.getMonth(), 1);
  const end = new Date(target.getFullYear(), target.getMonth() + 1, 0); // day 0 = last day of previous month
  const startsOn = nlDateFromJsDate(start);
  return { kind: PERIOD_KIND.calendarMonth, startsOn, endsOn: nlDateFromJsDate(end), label: formatMonthLabel(startsOn) };
}

function customMonthPeriod(date: NLDate, anchorDay: number): Period {
  const target = parseNLDate(date);
  const year = target.getFullYear();
  const monthIndex = target.getMonth();
  const thisAnchor = clampedAnchor(year, monthIndex, anchorDay);

  const boundaries =
    target >= thisAnchor
      ? { start: thisAnchor, end: clampedAnchor(year, monthIndex + 1, anchorDay) }
      : { start: clampedAnchor(year, monthIndex - 1, anchorDay), end: thisAnchor };

  const startsOn = nlDateFromJsDate(boundaries.start);
  const endsOn = addDays(nlDateFromJsDate(boundaries.end), -1);
  const label = `${formatShort(startsOn)} ${TEXT.enDash} ${formatShort(endsOn)}`;
  return { kind: PERIOD_KIND.customMonth, startsOn, endsOn, label };
}

function fourWeeksPeriod(date: NLDate, anchorDate: NLDate): Period {
  const daysSinceAnchor = daysBetween(anchorDate, date);
  const periodIndex = Math.floor(daysSinceAnchor / LIMITS.daysPerFourWeekPeriod);
  const startsOn = addDays(anchorDate, periodIndex * LIMITS.daysPerFourWeekPeriod);
  const endsOn = addDays(startsOn, LIMITS.daysPerFourWeekPeriod - 1);
  const cycleNumber = mod(periodIndex, LIMITS.fourWeekPeriodsPerYear) + 1;
  const label = `${TEXT.periode} ${cycleNumber} ${TEXT.middleDot} ${parseNLDate(startsOn).getFullYear()}`;
  return { kind: PERIOD_KIND.fourWeeks, startsOn, endsOn, label };
}

/** True modulo (never negative), unlike JS's `%`. */
function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

/**
 * The budget period that `date` falls into, for any of the three period kinds
 * (`docs/10` §1). `custom_month` and `four_weeks` clamp their anchor to the shortest
 * month/window involved, so periods never gap or overlap even around February.
 */
export function periodFor(date: NLDate, cfg: HouseholdPeriodConfig): Period {
  switch (cfg.kind) {
    case PERIOD_KIND.calendarMonth:
      return calendarMonthPeriod(date);
    case PERIOD_KIND.customMonth:
      return customMonthPeriod(date, cfg.anchorDay ?? 1);
    case PERIOD_KIND.fourWeeks:
      return fourWeeksPeriod(date, cfg.anchorDate ?? date);
    default: {
      const exhaustive: never = cfg.kind;
      throw new RangeError(`${TEXT.unknownPeriodKind} ${String(exhaustive)}`);
    }
  }
}

/**
 * Truncates the household's current, still-open period to end on `changeDate` when the
 * household changes `period_kind` mid-period — the new period starts the next day, computed
 * separately via `periodFor(addDays(changeDate, 1), newCfg)`. Already-closed historical
 * periods are never touched by this (`docs/10` §1).
 */
export function closePeriodOnKindChange(period: Period, changeDate: NLDate): Period {
  return { ...period, endsOn: changeDate };
}

/**
 * The number of budget periods from the period containing `from` through the period
 * containing `to`, inclusive — always ≥ 1, even when `to` is before `from` (`docs/10` §4.1).
 */
export function periodsBetween(from: NLDate, to: NLDate, cfg: HouseholdPeriodConfig): number {
  let current = periodFor(from, cfg);
  let count = 1;
  while (current.endsOn < to) {
    current = periodFor(addDays(current.endsOn, 1), cfg);
    count += 1;
  }
  return count;
}

export type { HouseholdPeriodConfig, Period, PeriodKind };
