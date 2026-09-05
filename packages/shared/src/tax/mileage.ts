import { cents, type Cents } from '../money';
import type { BusinessTrip, MileageSummary, TaxQuarter } from './types';
import { isInQuarter } from './btw-quarter';

/* ── Text ─────────────────────────────────────────────── */
export const MILEAGE_TEXT = {
  defaultRateNotice: 'tax.mileage: default rate is 23 cents per km (Belastingdienst 2026)',
} as const;

export const DEFAULT_KM_RATE_CENTS = 23;

export interface TripAllowanceOptions {
  readonly rateCentsPerKm?: number;
  readonly isPrivateVehicle?: boolean;
}

/* ── Pure Functions ───────────────────────────────────── */

/**
 * Calculates effective distance for a trip, taking round trip into account.
 */
export function getEffectiveTripDistanceKm(distanceKm: number, isRoundTrip: boolean): number {
  const safeDistance = Math.max(0, distanceKm);
  return isRoundTrip ? safeDistance * 2 : safeDistance;
}

/**
 * Computes tax-free kilometer allowance for a trip in cents.
 * Private vehicles earn the statutory rate (e.g. 23c/km).
 * Company cars do not earn the km allowance because their operating costs are deducted directly.
 */
export function computeTripAllowance(
  distanceKm: number,
  isRoundTrip: boolean,
  optionsOrRate: number | TripAllowanceOptions = DEFAULT_KM_RATE_CENTS,
): Cents {
  const isNumber = typeof optionsOrRate === 'number';
  const rateCentsPerKm = isNumber ? optionsOrRate : (optionsOrRate.rateCentsPerKm ?? DEFAULT_KM_RATE_CENTS);
  const isPrivateVehicle = isNumber ? true : (optionsOrRate.isPrivateVehicle ?? true);

  if (!isPrivateVehicle) {
    return cents(0);
  }
  const effectiveKm = getEffectiveTripDistanceKm(distanceKm, isRoundTrip);
  return cents(Math.round(effectiveKm * rateCentsPerKm));
}

/**
 * Aggregates a list of trips into a MileageSummary.
 */
export function computeMileageSummary(trips: readonly BusinessTrip[]): MileageSummary {
  let totalKm = 0;
  let totalAllowance = 0;
  let reimbursedAllowance = 0;

  for (const trip of trips) {
    const km = getEffectiveTripDistanceKm(trip.distanceKm, trip.isRoundTrip);
    totalKm += km;

    const allowance = computeTripAllowance(trip.distanceKm, trip.isRoundTrip, {
      rateCentsPerKm: trip.rateCentsPerKm,
      isPrivateVehicle: trip.vehicleType === 'private',
    });
    totalAllowance += allowance;

    if (trip.reimbursedAt != null) {
      reimbursedAllowance += allowance;
    }
  }

  return {
    totalDistanceKm: Math.round(totalKm * 100) / 100,
    totalAllowanceCents: cents(totalAllowance),
    reimbursedAllowanceCents: cents(reimbursedAllowance),
    pendingReimbursementCents: cents(Math.max(0, totalAllowance - reimbursedAllowance)),
    tripCount: trips.length,
  };
}

/**
 * Filters trips for a given calendar year based on tripDate (YYYY-MM-DD).
 */
export function filterTripsForYear(
  trips: readonly BusinessTrip[],
  year: number,
): readonly BusinessTrip[] {
  const prefix = `${year}-`;
  return trips.filter((t) => t.tripDate.startsWith(prefix));
}

/**
 * Filters trips occurring within a specific tax quarter.
 */
export function filterTripsForQuarter(
  trips: readonly BusinessTrip[],
  quarter: TaxQuarter,
): readonly BusinessTrip[] {
  return trips.filter((t) => isInQuarter(t.tripDate, quarter));
}
