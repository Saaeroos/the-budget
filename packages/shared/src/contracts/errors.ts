import { z } from 'zod';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = { unknownErrorCode: 'AppError: unknown error code' } as const;

/* ── Types ────────────────────────────────────────────── */

/** The fixed error-code union every Edge Function responds with (`docs/14` §5). */
export const ERROR_CODE = {
  authRequired: 'AUTH_REQUIRED',
  forbidden: 'FORBIDDEN',
  notFound: 'NOT_FOUND',
  validationFailed: 'VALIDATION_FAILED',
  rateLimited: 'RATE_LIMITED',
  bankConsentExpired: 'BANK_CONSENT_EXPIRED',
  bankScaRequired: 'BANK_SCA_REQUIRED',
  bankUnavailable: 'BANK_UNAVAILABLE',
  bankRateLimited: 'BANK_RATE_LIMITED',
  bankAccountUnsupported: 'BANK_ACCOUNT_UNSUPPORTED',
  importUnparseable: 'IMPORT_UNPARSEABLE',
  entitlementRequired: 'ENTITLEMENT_REQUIRED',
  conflict: 'CONFLICT',
  internal: 'INTERNAL',
} as const;
export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

interface ErrorCodeMeta {
  readonly httpStatus: number;
  readonly retryable: boolean;
  readonly i18nKey: string;
}

/** HTTP status, retryability and i18n key per error code (`docs/14` §5's table, verbatim). */
export const ERROR_CODE_META: Readonly<Record<ErrorCode, ErrorCodeMeta>> = {
  AUTH_REQUIRED: { httpStatus: 401, retryable: false, i18nKey: 'errors.auth_required' },
  FORBIDDEN: { httpStatus: 403, retryable: false, i18nKey: 'errors.forbidden' },
  NOT_FOUND: { httpStatus: 404, retryable: false, i18nKey: 'errors.not_found' },
  VALIDATION_FAILED: { httpStatus: 422, retryable: false, i18nKey: 'errors.validation' },
  RATE_LIMITED: { httpStatus: 429, retryable: true, i18nKey: 'errors.rate_limited' },
  BANK_CONSENT_EXPIRED: { httpStatus: 409, retryable: false, i18nKey: 'errors.bank_consent_expired' },
  BANK_SCA_REQUIRED: { httpStatus: 409, retryable: false, i18nKey: 'errors.bank_sca_required' },
  BANK_UNAVAILABLE: { httpStatus: 503, retryable: true, i18nKey: 'errors.bank_unavailable' },
  BANK_RATE_LIMITED: { httpStatus: 429, retryable: true, i18nKey: 'errors.bank_rate_limited' },
  BANK_ACCOUNT_UNSUPPORTED: { httpStatus: 422, retryable: false, i18nKey: 'errors.bank_account_unsupported' },
  IMPORT_UNPARSEABLE: { httpStatus: 422, retryable: false, i18nKey: 'errors.import_unparseable' },
  ENTITLEMENT_REQUIRED: { httpStatus: 402, retryable: false, i18nKey: 'errors.entitlement_required' },
  CONFLICT: { httpStatus: 409, retryable: true, i18nKey: 'errors.conflict' },
  INTERNAL: { httpStatus: 500, retryable: true, i18nKey: 'errors.internal' },
};

export const errorCodeSchema = z.enum(Object.values(ERROR_CODE) as [ErrorCode, ...ErrorCode[]]);

/** The error envelope every non-2xx Edge Function response carries (`docs/14` §5). */
export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    /** Dev-facing English detail. The client never displays this — only `code`'s i18n key. */
    message: z.string(),
    retryable: z.boolean(),
    meta: z.record(z.string(), z.unknown()),
  }),
});
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

/* ── Implementation ───────────────────────────────────── */

function isErrorCode(code: string): code is ErrorCode {
  return code in ERROR_CODE_META;
}

/**
 * The one error type Kwartje code throws across the app/edge-function boundary
 * (`.claude/rules/00-core.md` §4: "throw AppError with a code from the union in
 * docs/14-api-contracts.md §5"). `message` is dev-facing only — the UI maps `code`
 * to a localised string via `i18nKey`, never displaying `message` itself.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly httpStatus: number;
  readonly i18nKey: string;
  readonly meta: Readonly<Record<string, unknown>>;

  constructor(code: ErrorCode, message: string, meta: Readonly<Record<string, unknown>> = {}) {
    if (!isErrorCode(code)) {
      throw new RangeError(`${TEXT.unknownErrorCode}: ${String(code)}`);
    }
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.meta = meta;
    const codeMeta = ERROR_CODE_META[code];
    this.retryable = codeMeta.retryable;
    this.httpStatus = codeMeta.httpStatus;
    this.i18nKey = codeMeta.i18nKey;
  }

  toEnvelope(): ErrorEnvelope {
    return { error: { code: this.code, message: this.message, retryable: this.retryable, meta: this.meta } };
  }
}
