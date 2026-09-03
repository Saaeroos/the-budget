import { mul, type Cents } from '../money';

/* ── Types ────────────────────────────────────────────── */
// (none)

const LIMITS = {
  /** The statutory minimum holiday-allowance rate in the Netherlands (`docs/10` §9). */
  statutoryMinimumRate: 0.08,
} as const;

/* ── Implementation ───────────────────────────────────── */

/**
 * The statutory-minimum *gross* vakantiegeld estimate — 8% of gross annual pay
 * (`docs/10` §9). The net payout is materially lower once taxed at the bijzonder
 * tarief; computing that would be a tax calculation this app is not licensed to make,
 * so this function deliberately stops at the gross estimate.
 */
export function estimateVakantiegeld(grossAnnualCents: Cents): Cents {
  return mul(grossAnnualCents, LIMITS.statutoryMinimumRate);
}
