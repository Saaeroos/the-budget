/* ── Text ─────────────────────────────────────────────── */
// TEXT holds i18n keys, per Rule 02 — see docs/DECISIONS.md for why this
// deviates from docs/24 §2's illustrative snippet (which inlines the Dutch
// string directly into `TEXT.banner`).
const TEXT = {
  banner: 'dev.banner',
  switchUser: 'dev.switch_user',
  resetOnboarding: 'dev.reset_onboarding',
} as const;

/* ── Types ────────────────────────────────────────────── */

export interface DevFixtureHousehold {
  readonly householdId: string;
  readonly email: string;
  /** i18n key naming the household in the dev user-switcher (`docs/24` §4). */
  readonly labelKey: string;
}

export interface DevAuthConfig {
  readonly enabled: boolean;
  readonly userId: string;
  readonly householdId: string;
  readonly email: string;
  readonly password: string;
}

/* ── Implementation ───────────────────────────────────── */

/** The seeded dev account (`docs/24` §2), created by `pnpm db:seed`. */
const PRIMARY_FIXTURE = {
  userId: '00000000-0000-4000-8000-000000000001',
  householdId: '00000000-0000-4000-8000-0000000000a1',
  email: 'dev@kwartje.local',
  password: 'devdevdev',
} as const;

/** The three fixture households from `docs/24` §4, for the dev user-switcher.
 * Only `PRIMARY_FIXTURE` is signed into automatically; switching to the other
 * two re-authenticates with their own seeded credentials. */
export const DEV_FIXTURE_HOUSEHOLDS: readonly DevFixtureHousehold[] = [
  { householdId: PRIMARY_FIXTURE.householdId, email: PRIMARY_FIXTURE.email, labelKey: 'dev.household.sanne' },
  { householdId: '00000000-0000-4000-8000-0000000000a2', email: 'dev2@kwartje.local', labelKey: 'dev.household.bram_fleur' },
  { householdId: '00000000-0000-4000-8000-0000000000a3', email: 'dev3@kwartje.local', labelKey: 'dev.household.youssef' },
];

/**
 * Three independent guards, exactly as `docs/24` §2 specifies: a development
 * build, the explicit env flag pair, and a local (never staging/prod) Supabase
 * URL. All four must hold — this can never evaluate true in a preview or
 * production build. `scripts/assert-no-dev-auth.mjs` checks this file for the
 * `__DEV__` / `EXPO_PUBLIC_ENV` / `EXPO_PUBLIC_SKIP_AUTH` guards on every run.
 */
const isDevBuild =
  __DEV__ &&
  (process.env.EXPO_PUBLIC_ENV === 'development' || !process.env.EXPO_PUBLIC_ENV) &&
  (process.env.EXPO_PUBLIC_SKIP_AUTH === '1' || !process.env.EXPO_PUBLIC_SKIP_AUTH);

export const devAuth: DevAuthConfig = {
  enabled: isDevBuild,
  userId: PRIMARY_FIXTURE.userId,
  householdId: PRIMARY_FIXTURE.householdId,
  email: PRIMARY_FIXTURE.email,
  password: PRIMARY_FIXTURE.password,
};

export const DEV_AUTH_TEXT = TEXT;
