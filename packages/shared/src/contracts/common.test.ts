import { describe, expect, it } from 'vitest';
import { accountTypeSchema, centsSchema, instantSchema, languageSchema, nlDateStringSchema, platformSchema, remoteTransactionSchema } from './common';

describe('centsSchema', () => {
  it('accepts an integer', () => {
    expect(centsSchema.safeParse(1234).success).toBe(true);
  });

  it('rejects a fractional amount', () => {
    expect(centsSchema.safeParse(12.5).success).toBe(false);
  });
});

describe('nlDateStringSchema', () => {
  it('accepts a YYYY-MM-DD string', () => {
    expect(nlDateStringSchema.safeParse('2026-09-03').success).toBe(true);
  });

  it('rejects a differently formatted date', () => {
    expect(nlDateStringSchema.safeParse('03-09-2026').success).toBe(false);
  });
});

describe('instantSchema', () => {
  it('accepts an RFC3339 instant', () => {
    expect(instantSchema.safeParse('2026-09-03T12:00:00Z').success).toBe(true);
  });

  it('rejects a plain date', () => {
    expect(instantSchema.safeParse('2026-09-03').success).toBe(false);
  });
});

describe('platformSchema, languageSchema, accountTypeSchema', () => {
  it('accept their known members', () => {
    expect(platformSchema.safeParse('ios').success).toBe(true);
    expect(languageSchema.safeParse('nl').success).toBe(true);
    expect(accountTypeSchema.safeParse('joint').success).toBe(true);
  });

  it('reject an unknown member', () => {
    expect(platformSchema.safeParse('windows').success).toBe(false);
    expect(languageSchema.safeParse('de').success).toBe(false);
    expect(accountTypeSchema.safeParse('crypto').success).toBe(false);
  });
});

describe('remoteTransactionSchema', () => {
  it('round-trips a minimal remote transaction', () => {
    const result = remoteTransactionSchema.safeParse({ amount: '12.34', currency: 'EUR', status: 'booked', raw: {} });
    expect(result.success).toBe(true);
  });

  it('round-trips a fully populated remote transaction', () => {
    const input = {
      externalId: 'ext-1',
      bookingDate: '2026-09-03',
      valueDate: '2026-09-04',
      amount: '-12.34',
      currency: 'EUR',
      status: 'pending',
      creditorName: 'Albert Heijn',
      debtorName: 'J. Jansen',
      creditorIban: 'NL00INGB0000000000',
      debtorIban: 'NL00INGB0000000001',
      remittanceInformation: ['boodschappen'],
      endToEndId: 'e2e-1',
      proprietaryBankTransactionCode: 'PMNT',
      raw: { anything: true },
    };
    const result = remoteTransactionSchema.safeParse(input);
    expect(result).toEqual({ success: true, data: input });
  });

  it('rejects a transaction missing a required field', () => {
    const result = remoteTransactionSchema.safeParse({ amount: '12.34', currency: 'EUR' });
    expect(result.success).toBe(false);
  });
});
