import { z } from 'zod';
import { instantSchema } from './common';

/* ── Types ────────────────────────────────────────────── */
// (none — this file is schemas only)

/* ── Implementation ───────────────────────────────────── */

/**
 * `POST /account/delete` (`docs/14` §2). `confirm` must be the literal Dutch word the app
 * asks the user to type — this is not a translatable string, it is the confirmation value
 * itself, so it is never taken from `nl.json`.
 */
export const accountDeleteRequestSchema = z.object({ confirm: z.literal('VERWIJDER') });
export type AccountDeleteRequest = z.infer<typeof accountDeleteRequestSchema>;

export const accountDeleteResponseSchema = z.object({ ok: z.literal(true), deletedAt: instantSchema });
export type AccountDeleteResponse = z.infer<typeof accountDeleteResponseSchema>;
