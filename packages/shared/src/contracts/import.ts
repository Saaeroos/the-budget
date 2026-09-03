import { z } from 'zod';
import { remoteTransactionSchema } from './common';

/* ── Types ────────────────────────────────────────────── */
// (none — this file is schemas only)

/* ── Implementation ───────────────────────────────────── */

const importHintSchema = z.enum(['ing_csv', 'rabobank_csv', 'abnamro_csv', 'bunq_csv', 'sns_csv', 'mt940', 'camt053']);

/**
 * Which target field each source column maps to (`docs/14` §2's `ColumnMapping`, not
 * otherwise specified in the docs — see docs/DECISIONS.md, 2026-09-03 "ColumnMapping shape").
 */
export const columnMappingSchema = z.record(z.string(), z.string());
export type ColumnMapping = z.infer<typeof columnMappingSchema>;

/** `POST /import/parse` (`docs/14` §2). */
export const importParseRequestSchema = z.object({
  filename: z.string(),
  contentBase64: z.string(),
  hint: importHintSchema.optional(),
});
export type ImportParseRequest = z.infer<typeof importParseRequestSchema>;

export const importParseResponseSchema = z.object({
  detected: z.string(),
  rows: z.number().int().nonnegative(),
  preview: z.array(remoteTransactionSchema),
  mapping: columnMappingSchema.optional(),
  warnings: z.array(z.string()),
});
export type ImportParseResponse = z.infer<typeof importParseResponseSchema>;

/** `POST /import/commit` (`docs/14` §2). */
export const importCommitRequestSchema = z.object({
  householdId: z.string(),
  accountId: z.string(),
  /** The token returned by `/import/parse`. */
  token: z.string(),
});
export type ImportCommitRequest = z.infer<typeof importCommitRequestSchema>;

export const importCommitResponseSchema = z.object({
  inserted: z.number().int().nonnegative(),
  duplicates: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
});
export type ImportCommitResponse = z.infer<typeof importCommitResponseSchema>;
