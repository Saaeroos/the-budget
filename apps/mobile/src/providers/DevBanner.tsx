import { Banner } from '@/ui';
import { useT } from '@/i18n';
import { DEV_AUTH_TEXT, DEV_FIXTURE_HOUSEHOLDS, devAuth } from '@/lib/devAuth';
import { useDevActiveFixtureHouseholdId, useDevStore } from '@/store/devStore';

/* ── Text ─────────────────────────────────────────────── */
// Reuses `DEV_AUTH_TEXT` from `lib/devAuth.ts` — no new keys declared here.

const TEST_ID = { banner: 'dev-banner' } as const;

/* ── Types ────────────────────────────────────────────── */
// (none)

/* ── Implementation ───────────────────────────────────── */

function nextFixtureHousehold(currentHouseholdId: string) {
  const currentIndex = DEV_FIXTURE_HOUSEHOLDS.findIndex((h) => h.householdId === currentHouseholdId);
  const nextIndex = (currentIndex + 1) % DEV_FIXTURE_HOUSEHOLDS.length;
  return DEV_FIXTURE_HOUSEHOLDS[nextIndex];
}

/**
 * `docs/24` §2/§3: an unmissable proof that this is a dev build, with a tap
 * target that cycles the three seeded fixture households. Renders nothing
 * outside a dev build.
 */
export function DevBanner() {
  const t = useT();
  const activeHouseholdId = useDevActiveFixtureHouseholdId();
  const setActiveFixtureHouseholdId = useDevStore((s) => s.setActiveFixtureHouseholdId);

  if (!devAuth.enabled) return null;

  const handleSwitchUser = (): void => {
    const next = nextFixtureHousehold(activeHouseholdId);
    if (next) setActiveFixtureHouseholdId(next.householdId);
  };

  return (
    <Banner
      testID={TEST_ID.banner}
      tone="warn"
      message={t(DEV_AUTH_TEXT.banner)}
      action={{ label: t(DEV_AUTH_TEXT.switchUser), onPress: handleSwitchUser }}
    />
  );
}
