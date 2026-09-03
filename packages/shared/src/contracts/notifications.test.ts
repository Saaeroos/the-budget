import { describe, expect, it } from 'vitest';
import { notificationsRegisterRequestSchema, notificationsRegisterResponseSchema } from './notifications';

describe('notifications/register', () => {
  it('round-trips a request', () => {
    const request = { expoPushToken: 'ExponentPushToken[abc]', platform: 'ios', locale: 'nl-NL' };
    expect(notificationsRegisterRequestSchema.safeParse(request).success).toBe(true);
  });

  it('rejects an unknown platform', () => {
    const request = { expoPushToken: 'ExponentPushToken[abc]', platform: 'web', locale: 'nl-NL' };
    expect(notificationsRegisterRequestSchema.safeParse(request).success).toBe(false);
  });

  it('round-trips a response', () => {
    expect(notificationsRegisterResponseSchema.safeParse({ ok: true }).success).toBe(true);
  });

  it('rejects ok: false', () => {
    expect(notificationsRegisterResponseSchema.safeParse({ ok: false }).success).toBe(false);
  });
});
