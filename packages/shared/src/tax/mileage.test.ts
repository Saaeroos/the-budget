import { describe, expect, it } from 'vitest';
import { cents } from '../money';
import { nlDate } from '../dates';
import {
  computeMileageSummary,
  computeTripAllowance,
  filterTripsForQuarter,
  filterTripsForYear,
  getEffectiveTripDistanceKm,
} from './mileage';
import type { BusinessTrip } from './types';
import { quarterForDate } from './btw-quarter';

describe('mileage engine', () => {
  it('calculates effective trip distance correctly for single and round trips', () => {
    expect(getEffectiveTripDistanceKm(15.5, false)).toBe(15.5);
    expect(getEffectiveTripDistanceKm(15.5, true)).toBe(31);
    expect(getEffectiveTripDistanceKm(-5, false)).toBe(0);
  });

  it('computes allowance for private vehicle at 23 cents per km', () => {
    // 10 km single trip -> 10 * 23 = 230 cents
    expect(computeTripAllowance(10, false, { rateCentsPerKm: 23, isPrivateVehicle: true })).toBe(cents(230));

    // 10 km round trip -> 20 * 23 = 460 cents
    expect(computeTripAllowance(10, true, { rateCentsPerKm: 23, isPrivateVehicle: true })).toBe(cents(460));

    // 12.3 km single trip -> 12.3 * 23 = 282.9 -> 283 cents
    expect(computeTripAllowance(12.3, false, { rateCentsPerKm: 23, isPrivateVehicle: true })).toBe(cents(283));
  });

  it('returns 0 allowance for company car (business vehicle)', () => {
    expect(computeTripAllowance(100, true, { rateCentsPerKm: 23, isPrivateVehicle: false })).toBe(cents(0));
  });

  it('computes mileage summary aggregating distance, allowance, and pending reimbursement', () => {
    const trips: BusinessTrip[] = [
      {
        id: 'trip-1',
        tripDate: nlDate('2026-03-15'),
        departureLocation: 'Amsterdam',
        destinationLocation: 'Utrecht',
        distanceKm: 40,
        isRoundTrip: true, // 80 km -> 80 * 23 = 1840 cents
        rateCentsPerKm: 23,
        purpose: 'Klantbezoek Acronis',
        vehicleType: 'private',
        reimbursedAt: '2026-03-20T10:00:00Z',
      },
      {
        id: 'trip-2',
        tripDate: nlDate('2026-03-18'),
        departureLocation: 'Amsterdam',
        destinationLocation: 'Rotterdam',
        distanceKm: 75,
        isRoundTrip: false, // 75 km -> 75 * 23 = 1725 cents
        rateCentsPerKm: 23,
        purpose: 'Design sprint',
        vehicleType: 'private',
        reimbursedAt: undefined,
      },
      {
        id: 'trip-3',
        tripDate: nlDate('2026-04-02'),
        departureLocation: 'Amsterdam',
        destinationLocation: 'Den Haag',
        distanceKm: 60,
        isRoundTrip: false,
        rateCentsPerKm: 23,
        purpose: 'Ministerie bezoek',
        vehicleType: 'business', // 0 cents
        reimbursedAt: undefined,
      },
    ];

    const summary = computeMileageSummary(trips);
    expect(summary.tripCount).toBe(3);
    // 80 + 75 + 60 = 215 km
    expect(summary.totalDistanceKm).toBe(215);
    // 1840 + 1725 = 3565 cents
    expect(summary.totalAllowanceCents).toBe(cents(3565));
    // trip-1 was reimbursed: 1840 cents
    expect(summary.reimbursedAllowanceCents).toBe(cents(1840));
    // trip-2 pending: 1725 cents
    expect(summary.pendingReimbursementCents).toBe(cents(1725));
  });

  it('filters trips by year and quarter', () => {
    const trips: BusinessTrip[] = [
      {
        id: 'trip-1',
        tripDate: nlDate('2025-12-10'),
        departureLocation: 'A',
        destinationLocation: 'B',
        distanceKm: 10,
        isRoundTrip: false,
        rateCentsPerKm: 23,
        purpose: 'Test',
        vehicleType: 'private',
      },
      {
        id: 'trip-2',
        tripDate: nlDate('2026-02-14'),
        departureLocation: 'A',
        destinationLocation: 'B',
        distanceKm: 20,
        isRoundTrip: false,
        rateCentsPerKm: 23,
        purpose: 'Test',
        vehicleType: 'private',
      },
      {
        id: 'trip-3',
        tripDate: nlDate('2026-05-10'),
        departureLocation: 'A',
        destinationLocation: 'B',
        distanceKm: 30,
        isRoundTrip: false,
        rateCentsPerKm: 23,
        purpose: 'Test',
        vehicleType: 'private',
      },
    ];

    const year2026Trips = filterTripsForYear(trips, 2026);
    expect(year2026Trips).toHaveLength(2);
    expect(year2026Trips[0]?.id).toBe('trip-2');

    const q1 = quarterForDate(nlDate('2026-02-01'));
    const q1Trips = filterTripsForQuarter(trips, q1);
    expect(q1Trips).toHaveLength(1);
    expect(q1Trips[0]?.id).toBe('trip-2');
  });
});
