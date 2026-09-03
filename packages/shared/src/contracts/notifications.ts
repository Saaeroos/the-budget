import { z } from 'zod';
import { platformSchema } from './common';

/* ── Types ────────────────────────────────────────────── */
// (none — this file is schemas only)

/* ── Implementation ───────────────────────────────────── */

/** `POST /notifications/register` (`docs/14` §2). */
export const notificationsRegisterRequestSchema = z.object({
  expoPushToken: z.string(),
  platform: platformSchema,
  locale: z.string(),
});
export type NotificationsRegisterRequest = z.infer<typeof notificationsRegisterRequestSchema>;

export const notificationsRegisterResponseSchema = z.object({ ok: z.literal(true) });
export type NotificationsRegisterResponse = z.infer<typeof notificationsRegisterResponseSchema>;
