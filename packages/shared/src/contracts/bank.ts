import { z } from 'zod';
import { accountTypeSchema, centsSchema, instantSchema, languageSchema } from './common';

/* ── Types ────────────────────────────────────────────── */
// (none — this file is schemas only)

/* ── Implementation ───────────────────────────────────── */

/** `POST /bank/institutions` (`docs/14` §2). */
export const bankInstitutionsRequestSchema = z.object({ country: z.literal('NL') });
export type BankInstitutionsRequest = z.infer<typeof bankInstitutionsRequestSchema>;

export const bankInstitutionsResponseSchema = z.object({
  institutions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      logoKey: z.string(),
      supportsAccountTypes: z.array(z.enum(['payment', 'savings', 'card'])),
      /** i18n key, e.g. `bank.notice.abn_creditcard` — never rendered as English fallback text. */
      noticeKey: z.string().optional(),
      maxConsentDays: z.number().int().positive(),
    }),
  ),
});
export type BankInstitutionsResponse = z.infer<typeof bankInstitutionsResponseSchema>;

/** `POST /bank/connect` (`docs/14` §2). */
export const bankConnectRequestSchema = z.object({ institutionId: z.string(), language: languageSchema });
export type BankConnectRequest = z.infer<typeof bankConnectRequestSchema>;

export const bankConnectResponseSchema = z.object({
  connectionId: z.string(),
  authUrl: z.string().url(),
  expiresAt: instantSchema,
});
export type BankConnectResponse = z.infer<typeof bankConnectResponseSchema>;

/** `POST /bank/callback` (`docs/14` §2). */
export const bankCallbackRequestSchema = z.object({ state: z.string(), code: z.string() });
export type BankCallbackRequest = z.infer<typeof bankCallbackRequestSchema>;

export const bankCallbackResponseSchema = z.object({
  connectionId: z.string(),
  accounts: z.array(
    z.object({
      id: z.string(),
      displayName: z.string(),
      ibanLast4: z.string().length(4),
      accountType: accountTypeSchema,
      balanceCents: centsSchema.nullable(),
    }),
  ),
});
export type BankCallbackResponse = z.infer<typeof bankCallbackResponseSchema>;

const bankSyncModeSchema = z.enum(['incremental', 'deep']);

/** `POST /bank/sync` (`docs/14` §2). */
export const bankSyncRequestSchema = z.object({ connectionId: z.string(), mode: bankSyncModeSchema.optional() });
export type BankSyncRequest = z.infer<typeof bankSyncRequestSchema>;

export const bankSyncResponseSchema = z.object({
  jobId: z.string(),
  state: z.enum(['queued', 'running', 'done']),
  stats: z.object({ inserted: z.number().int(), updated: z.number().int(), accounts: z.number().int() }).optional(),
  nextCursor: z.string().optional(),
});
export type BankSyncResponse = z.infer<typeof bankSyncResponseSchema>;

/** `POST /bank/revoke` (`docs/14` §2). */
export const bankRevokeRequestSchema = z.object({ connectionId: z.string(), deleteTransactions: z.literal(false).optional() });
export type BankRevokeRequest = z.infer<typeof bankRevokeRequestSchema>;

export const bankRevokeResponseSchema = z.object({ ok: z.literal(true) });
export type BankRevokeResponse = z.infer<typeof bankRevokeResponseSchema>;
