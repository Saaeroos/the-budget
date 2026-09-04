import type { ConfigContext, ExpoConfig } from 'expo/config';

/* ── Text ─────────────────────────────────────────────── */
// (none — build-time config, no user-facing or logged strings)

/* ── Types ────────────────────────────────────────────── */
// (none beyond Expo's own `ExpoConfig`/`ConfigContext`)

/* ── Implementation ───────────────────────────────────── */

/**
 * Layers dynamic `extra` values on top of the static `app.json` (`docs/13`
 * §10). `devAuth.ts`'s dev-bypass guard reads `extra.supabaseUrl` — without
 * this file it would always be `undefined` and `pnpm dev` could never land
 * on Vandaag without a login screen (`CLAUDE.md` §8). See `docs/DECISIONS.md`.
 */
export default function appConfig({ config }: ConfigContext): ExpoConfig {
  return {
    ...config,
    extra: {
      ...config.extra,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    },
  } as ExpoConfig;
}
