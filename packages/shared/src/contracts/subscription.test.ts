import { describe, expect, it } from 'vitest';
import { subscriptionSyncRequestSchema, subscriptionSyncResponseSchema } from './subscription';

describe('subscription/sync', () => {
  it('round-trips a request', () => {
    expect(subscriptionSyncRequestSchema.safeParse({ revenueCatCustomerId: 'rc-1' }).success).toBe(true);
  });

  it('rejects a request missing the customer id', () => {
    expect(subscriptionSyncRequestSchema.safeParse({}).success).toBe(false);
  });

  it('round-trips a response with an expiry', () => {
    expect(subscriptionSyncResponseSchema.safeParse({ entitlement: 'plus', expiresAt: '2027-01-01T00:00:00Z' }).success).toBe(true);
  });

  it('round-trips a response with a null expiry (household tier, no fixed end)', () => {
    expect(subscriptionSyncResponseSchema.safeParse({ entitlement: 'household', expiresAt: null }).success).toBe(true);
  });

  it('rejects an unknown entitlement tier', () => {
    expect(subscriptionSyncResponseSchema.safeParse({ entitlement: 'pro', expiresAt: null }).success).toBe(false);
  });
});
