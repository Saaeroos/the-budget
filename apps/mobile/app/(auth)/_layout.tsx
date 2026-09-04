import { Stack } from 'expo-router';

/* ── Implementation ───────────────────────────────────── */

/** `docs/05` §2 — Welkom → Inloggen → Code, no header chrome. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
