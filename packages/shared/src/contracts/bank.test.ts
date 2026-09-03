import { describe, expect, it } from 'vitest';
import {
  bankCallbackRequestSchema,
  bankCallbackResponseSchema,
  bankConnectRequestSchema,
  bankConnectResponseSchema,
  bankInstitutionsRequestSchema,
  bankInstitutionsResponseSchema,
  bankRevokeRequestSchema,
  bankRevokeResponseSchema,
  bankSyncRequestSchema,
  bankSyncResponseSchema,
} from './bank';

describe('bank/institutions', () => {
  it('round-trips a request', () => {
    expect(bankInstitutionsRequestSchema.safeParse({ country: 'NL' }).success).toBe(true);
  });

  it('rejects a non-NL country', () => {
    expect(bankInstitutionsRequestSchema.safeParse({ country: 'BE' }).success).toBe(false);
  });

  it('round-trips a response with and without the optional noticeKey', () => {
    const withNotice = {
      institutions: [{ id: 'ing', name: 'ING', logoKey: 'ing', supportsAccountTypes: ['payment', 'savings'], noticeKey: 'bank.notice.ing', maxConsentDays: 90 }],
    };
    const withoutNotice = {
      institutions: [{ id: 'abn', name: 'ABN AMRO', logoKey: 'abn', supportsAccountTypes: ['payment'], maxConsentDays: 90 }],
    };
    expect(bankInstitutionsResponseSchema.safeParse(withNotice).success).toBe(true);
    expect(bankInstitutionsResponseSchema.safeParse(withoutNotice).success).toBe(true);
  });

  it('rejects an unsupported account type', () => {
    const invalid = { institutions: [{ id: 'ing', name: 'ING', logoKey: 'ing', supportsAccountTypes: ['crypto'], maxConsentDays: 90 }] };
    expect(bankInstitutionsResponseSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('bank/connect', () => {
  it('round-trips a request', () => {
    expect(bankConnectRequestSchema.safeParse({ institutionId: 'ing', language: 'nl' }).success).toBe(true);
  });

  it('rejects an unsupported language', () => {
    expect(bankConnectRequestSchema.safeParse({ institutionId: 'ing', language: 'fr' }).success).toBe(false);
  });

  it('round-trips a response', () => {
    const response = { connectionId: 'c1', authUrl: 'https://bank.example/authorize', expiresAt: '2026-09-03T12:00:00Z' };
    expect(bankConnectResponseSchema.safeParse(response).success).toBe(true);
  });

  it('rejects a non-URL authUrl', () => {
    const response = { connectionId: 'c1', authUrl: 'not-a-url', expiresAt: '2026-09-03T12:00:00Z' };
    expect(bankConnectResponseSchema.safeParse(response).success).toBe(false);
  });
});

describe('bank/callback', () => {
  it('round-trips a request', () => {
    expect(bankCallbackRequestSchema.safeParse({ state: 's', code: 'c' }).success).toBe(true);
  });

  it('rejects a request missing the code', () => {
    expect(bankCallbackRequestSchema.safeParse({ state: 's' }).success).toBe(false);
  });

  it('round-trips a response, including a null balance', () => {
    const response = {
      connectionId: 'c1',
      accounts: [{ id: 'a1', displayName: 'Betaalrekening', ibanLast4: '1234', accountType: 'payment', balanceCents: null }],
    };
    expect(bankCallbackResponseSchema.safeParse(response).success).toBe(true);
  });

  it('rejects an ibanLast4 that is not exactly 4 characters', () => {
    const response = {
      connectionId: 'c1',
      accounts: [{ id: 'a1', displayName: 'Betaalrekening', ibanLast4: '12345', accountType: 'payment', balanceCents: 100 }],
    };
    expect(bankCallbackResponseSchema.safeParse(response).success).toBe(false);
  });
});

describe('bank/sync', () => {
  it('round-trips a minimal request', () => {
    expect(bankSyncRequestSchema.safeParse({ connectionId: 'c1' }).success).toBe(true);
  });

  it('rejects an unknown sync mode', () => {
    expect(bankSyncRequestSchema.safeParse({ connectionId: 'c1', mode: 'full' }).success).toBe(false);
  });

  it('round-trips a response with stats and nextCursor', () => {
    const response = { jobId: 'j1', state: 'done', stats: { inserted: 5, updated: 2, accounts: 1 }, nextCursor: 'abc' };
    expect(bankSyncResponseSchema.safeParse(response).success).toBe(true);
  });

  it('rejects an unknown job state', () => {
    expect(bankSyncResponseSchema.safeParse({ jobId: 'j1', state: 'exploded' }).success).toBe(false);
  });
});

describe('bank/revoke', () => {
  it('round-trips a request', () => {
    expect(bankRevokeRequestSchema.safeParse({ connectionId: 'c1' }).success).toBe(true);
  });

  it('rejects deleteTransactions being true (the contract only allows false)', () => {
    expect(bankRevokeRequestSchema.safeParse({ connectionId: 'c1', deleteTransactions: true }).success).toBe(false);
  });

  it('round-trips a response', () => {
    expect(bankRevokeResponseSchema.safeParse({ ok: true }).success).toBe(true);
  });

  it('rejects ok: false', () => {
    expect(bankRevokeResponseSchema.safeParse({ ok: false }).success).toBe(false);
  });
});
