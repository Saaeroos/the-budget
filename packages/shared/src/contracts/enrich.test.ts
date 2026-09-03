import { describe, expect, it } from 'vitest';
import { enrichRequestSchema, enrichResponseSchema } from './enrich';

describe('enrich', () => {
  it('round-trips a minimal request', () => {
    expect(enrichRequestSchema.safeParse({ householdId: 'h1' }).success).toBe(true);
  });

  it('round-trips a full request', () => {
    expect(enrichRequestSchema.safeParse({ householdId: 'h1', transactionIds: ['t1', 't2'], full: true }).success).toBe(true);
  });

  it('rejects a request missing householdId', () => {
    expect(enrichRequestSchema.safeParse({}).success).toBe(false);
  });

  it('round-trips a response', () => {
    expect(enrichResponseSchema.safeParse({ categorised: 40, needsReview: 3, seriesDetected: 1 }).success).toBe(true);
  });

  it('rejects a negative count', () => {
    expect(enrichResponseSchema.safeParse({ categorised: -1, needsReview: 0, seriesDetected: 0 }).success).toBe(false);
  });
});
