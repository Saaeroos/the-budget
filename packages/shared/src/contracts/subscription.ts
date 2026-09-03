import { z } from 'zod';
import { instantSchema } from './common';

/* ── Types ────────────────────────────────────────────── */
// (none — this file is schemas only)

/* ── Implementation ───────────────────────────────────── */

/** `POST /subscription/sync` (`docs/14` §2). Entitlement is always verified server-side against RevenueCat. */
export const subscriptionSyncRequestSchema = z.object({ revenueCatCustomerId: z.string() });
export type SubscriptionSyncRequest = z.infer<typeof subscriptionSyncRequestSchema>;

export const subscriptionSyncResponseSchema = z.object({
  entitlement: z.enum(['free', 'plus', 'household']),
  expiresAt: instantSchema.nullable(),
});
export type SubscriptionSyncResponse = z.infer<typeof subscriptionSyncResponseSchema>;
