import { describe, expect, it } from 'vitest';
import { AppError, ERROR_CODE, ERROR_CODE_META, errorEnvelopeSchema, type ErrorCode } from './errors';

describe('AppError', () => {
  it('carries the HTTP status, retryability and i18n key for its code', () => {
    const error = new AppError(ERROR_CODE.bankRateLimited, 'too many sync calls');
    expect(error.code).toBe('BANK_RATE_LIMITED');
    expect(error.httpStatus).toBe(429);
    expect(error.retryable).toBe(true);
    expect(error.i18nKey).toBe('errors.bank_rate_limited');
    expect(error.message).toBe('too many sync calls');
    expect(error).toBeInstanceOf(Error);
  });

  it('defaults meta to an empty object', () => {
    const error = new AppError(ERROR_CODE.notFound, 'missing');
    expect(error.meta).toEqual({});
  });

  it('carries caller-supplied meta', () => {
    const error = new AppError(ERROR_CODE.validationFailed, 'bad body', { field: 'amount_cents' });
    expect(error.meta).toEqual({ field: 'amount_cents' });
  });

  it('serialises to the error envelope shape, never leaking meta into message', () => {
    const error = new AppError(ERROR_CODE.conflict, 'stale write', { entity: 'budget_line' });
    expect(error.toEnvelope()).toEqual({
      error: { code: 'CONFLICT', message: 'stale write', retryable: true, meta: { entity: 'budget_line' } },
    });
  });

  it('throws for a code outside the known union', () => {
    const invalid = 'NOT_A_REAL_CODE' as unknown as ErrorCode;
    expect(() => new AppError(invalid, 'x')).toThrow(/unknown error code/);
  });

  it('every ERROR_CODE value has metadata', () => {
    for (const code of Object.values(ERROR_CODE)) {
      expect(ERROR_CODE_META[code]).toBeDefined();
    }
  });
});

describe('errorEnvelopeSchema', () => {
  it('parses a well-formed error envelope', () => {
    const result = errorEnvelopeSchema.safeParse({
      error: { code: 'RATE_LIMITED', message: 'slow down', retryable: true, meta: {} },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an envelope with an unknown code', () => {
    const result = errorEnvelopeSchema.safeParse({
      error: { code: 'MADE_UP', message: 'x', retryable: false, meta: {} },
    });
    expect(result.success).toBe(false);
  });
});
