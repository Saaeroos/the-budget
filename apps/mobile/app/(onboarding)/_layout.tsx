import { Stack } from 'expo-router';

/* ── Implementation ───────────────────────────────────── */

/**
 * `docs/05` §2 — the resumable progress bar across the five onboarding
 * screens is wired up by the onboarding ticket once the real screens exist;
 * this establishes the route group and its (header-less) stack only.
 */
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
