import { z } from 'zod';

/* ── Types ────────────────────────────────────────────── */
// (none — this file is schemas only)

/* ── Implementation ───────────────────────────────────── */

/** An amount of money crossing the wire — always an integer number of cents (`docs/14` §1). */
export const centsSchema = z.number().int();

/** A business date, `YYYY-MM-DD` (`docs/14` §1). */
export const nlDateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** An instant, RFC3339 UTC (`docs/14` §1). */
export const instantSchema = z.string().datetime({ offset: true });

export const platformSchema = z.enum(['ios', 'android']);
export const languageSchema = z.enum(['nl', 'en']);
export const accountTypeSchema = z.enum(['payment', 'savings', 'card', 'joint']);

/**
 * The aggregator adapter's normalised transaction shape (`docs/08` §3). Unlike our own
 * API payloads, `amount` here is a signed decimal string — this is the raw external
 * representation before normalisation into integer cents, not a Kwartje contract field.
 */
export const remoteTransactionSchema = z.object({
  externalId: z.string().optional(),
  bookingDate: nlDateStringSchema.optional(),
  valueDate: nlDateStringSchema.optional(),
  amount: z.string(),
  currency: z.string(),
  status: z.enum(['booked', 'pending']),
  creditorName: z.string().optional(),
  debtorName: z.string().optional(),
  creditorIban: z.string().optional(),
  debtorIban: z.string().optional(),
  remittanceInformation: z.array(z.string()).optional(),
  endToEndId: z.string().optional(),
  proprietaryBankTransactionCode: z.string().optional(),
  raw: z.unknown(),
});
export type RemoteTransaction = z.infer<typeof remoteTransactionSchema>;
