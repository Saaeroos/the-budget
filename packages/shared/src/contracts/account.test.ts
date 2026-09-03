import { describe, expect, it } from 'vitest';
import { accountDeleteRequestSchema, accountDeleteResponseSchema } from './account';

describe('account/delete', () => {
  it('round-trips a request with the exact confirmation word', () => {
    expect(accountDeleteRequestSchema.safeParse({ confirm: 'VERWIJDER' }).success).toBe(true);
  });

  it('rejects any other confirmation value', () => {
    expect(accountDeleteRequestSchema.safeParse({ confirm: 'DELETE' }).success).toBe(false);
  });

  it('round-trips a response', () => {
    expect(accountDeleteResponseSchema.safeParse({ ok: true, deletedAt: '2026-09-03T12:00:00Z' }).success).toBe(true);
  });

  it('rejects a response missing deletedAt', () => {
    expect(accountDeleteResponseSchema.safeParse({ ok: true }).success).toBe(false);
  });
});
