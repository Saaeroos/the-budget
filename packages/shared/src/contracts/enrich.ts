import { z } from 'zod';

/* ── Types ────────────────────────────────────────────── */
// (none — this file is schemas only)

/* ── Implementation ───────────────────────────────────── */

/** `POST /enrich` (`docs/14` §2). */
export const enrichRequestSchema = z.object({
  householdId: z.string(),
  transactionIds: z.array(z.string()).optional(),
  full: z.boolean().optional(),
});
export type EnrichRequest = z.infer<typeof enrichRequestSchema>;

export const enrichResponseSchema = z.object({
  categorised: z.number().int().nonnegative(),
  needsReview: z.number().int().nonnegative(),
  seriesDetected: z.number().int().nonnegative(),
});
export type EnrichResponse = z.infer<typeof enrichResponseSchema>;
