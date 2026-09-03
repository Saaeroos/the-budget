import { describe, expect, it } from 'vitest';
import { exportRequestSchema, exportResponseSchema } from './export';

describe('export', () => {
  it('round-trips a minimal request', () => {
    expect(exportRequestSchema.safeParse({ householdId: 'h1', format: 'csv' }).success).toBe(true);
  });

  it('round-trips a request with a date range', () => {
    const request = { householdId: 'h1', format: 'pdf_nibud', from: '2026-01-01', to: '2026-12-31' };
    expect(exportRequestSchema.safeParse(request).success).toBe(true);
  });

  it('rejects an unknown format', () => {
    expect(exportRequestSchema.safeParse({ householdId: 'h1', format: 'yaml' }).success).toBe(false);
  });

  it('round-trips a response', () => {
    const response = { url: 'https://storage.example/export.csv', expiresAt: '2026-09-03T12:00:00Z' };
    expect(exportResponseSchema.safeParse(response).success).toBe(true);
  });

  it('rejects a non-instant expiresAt', () => {
    const response = { url: 'https://storage.example/export.csv', expiresAt: '2026-09-03' };
    expect(exportResponseSchema.safeParse(response).success).toBe(false);
  });
});
