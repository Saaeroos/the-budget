import { describe, expect, it } from 'vitest';
import { columnMappingSchema, importCommitRequestSchema, importCommitResponseSchema, importParseRequestSchema, importParseResponseSchema } from './import';

describe('columnMappingSchema', () => {
  it('round-trips a field-to-column mapping', () => {
    expect(columnMappingSchema.safeParse({ booked_at: 'Datum', amount_cents: 'Bedrag' }).success).toBe(true);
  });

  it('rejects a non-string value', () => {
    expect(columnMappingSchema.safeParse({ booked_at: 3 }).success).toBe(false);
  });
});

describe('import/parse', () => {
  it('round-trips a request with a hint', () => {
    const request = { filename: 'export.csv', contentBase64: 'YWJj', hint: 'ing_csv' };
    expect(importParseRequestSchema.safeParse(request).success).toBe(true);
  });

  it('rejects an unknown hint', () => {
    const request = { filename: 'export.csv', contentBase64: 'YWJj', hint: 'quicken' };
    expect(importParseRequestSchema.safeParse(request).success).toBe(false);
  });

  it('round-trips a response', () => {
    const response = {
      detected: 'ing_csv',
      rows: 42,
      preview: [{ amount: '12.34', currency: 'EUR', status: 'booked', raw: {} }],
      mapping: { booked_at: 'Datum' },
      warnings: ['2 rows skipped: empty amount'],
    };
    expect(importParseResponseSchema.safeParse(response).success).toBe(true);
  });

  it('rejects a response with a malformed preview transaction', () => {
    const response = { detected: 'ing_csv', rows: 1, preview: [{ currency: 'EUR' }], warnings: [] };
    expect(importParseResponseSchema.safeParse(response).success).toBe(false);
  });
});

describe('import/commit', () => {
  it('round-trips a request', () => {
    expect(importCommitRequestSchema.safeParse({ householdId: 'h1', accountId: 'a1', token: 'tok' }).success).toBe(true);
  });

  it('rejects a request missing the token', () => {
    expect(importCommitRequestSchema.safeParse({ householdId: 'h1', accountId: 'a1' }).success).toBe(false);
  });

  it('round-trips a response', () => {
    expect(importCommitResponseSchema.safeParse({ inserted: 40, duplicates: 2, skipped: 0 }).success).toBe(true);
  });

  it('rejects a negative count', () => {
    expect(importCommitResponseSchema.safeParse({ inserted: -1, duplicates: 0, skipped: 0 }).success).toBe(false);
  });
});
