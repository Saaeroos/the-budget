import { z } from 'zod';
import { instantSchema, nlDateStringSchema } from './common';

/* ── Types ────────────────────────────────────────────── */
// (none — this file is schemas only)

/* ── Implementation ───────────────────────────────────── */

/** `POST /export` (`docs/14` §2). */
export const exportRequestSchema = z.object({
  householdId: z.string(),
  format: z.enum(['csv', 'xlsx', 'json', 'pdf_nibud']),
  from: nlDateStringSchema.optional(),
  to: nlDateStringSchema.optional(),
});
export type ExportRequest = z.infer<typeof exportRequestSchema>;

export const exportResponseSchema = z.object({
  /** A signed Storage URL, valid for 1 hour. */
  url: z.string().url(),
  expiresAt: instantSchema,
});
export type ExportResponse = z.infer<typeof exportResponseSchema>;
