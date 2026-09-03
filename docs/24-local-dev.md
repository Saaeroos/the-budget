# 24 — Local development

## 1. First run

```bash
pnpm install
supabase start                       # local Postgres + Auth + Storage on :54321
pnpm db:migrate                      # applies supabase/migrations
pnpm db:seed                         # categories, merchants, NL calendar, fixture households
pnpm dev                             # expo start --dev-client
```

`pnpm dev` must land on **Vandaag with real fixture data and no login screen**. If a developer has to sign in to see a budget, the setup is broken.

## 2. Auth bypass (development only)

Controlled by a single flag. It is **impossible** to enable in preview or production builds — the guard checks three independent conditions.

`src/lib/devAuth.ts`
```ts
import Constants from 'expo-constants';

const TEXT = {
  banner: 'DEV — ingelogd als testgebruiker',
} as const;

export interface DevAuthConfig {
  readonly enabled: boolean;
  readonly userId: string;
  readonly householdId: string;
  readonly email: string;
}

const isDevBuild =
  __DEV__ &&
  process.env.EXPO_PUBLIC_ENV === 'development' &&
  process.env.EXPO_PUBLIC_SKIP_AUTH === '1' &&
  String(Constants.expoConfig?.extra?.supabaseUrl ?? '').includes('localhost');

export const devAuth: DevAuthConfig = {
  enabled: isDevBuild,
  userId: '00000000-0000-4000-8000-000000000001',
  householdId: '00000000-0000-4000-8000-0000000000a1',
  email: 'dev@kwartje.local',
};

export const DEV_AUTH_TEXT = TEXT;
```

`AuthProvider` behaviour when `devAuth.enabled`:
1. Skip the `(auth)` route group entirely — the root layout redirects straight to `(tabs)`.
2. Sign in to the **local** Supabase with a seeded service account using a password grant (`dev@kwartje.local` / `devdevdev`), created by `pnpm db:seed`. This means RLS is exercised exactly as in production — the bypass skips the *screen*, not the *authorisation*.
3. Render a persistent 20px dev banner at the top of the screen with `DEV_AUTH_TEXT.banner` and a "wissel gebruiker" tap target, so nobody ever mistakes a dev build for a real one.

**Never** implement the bypass by faking a session object or by disabling RLS. Both hide real bugs and both have shipped to production in other codebases.

CI guard (`scripts/assert-no-dev-auth.ts`, run in `release.yml`):
```
fail if EXPO_PUBLIC_SKIP_AUTH is set in the preview or production EAS profile
fail if devAuth.enabled can evaluate true when EXPO_PUBLIC_ENV !== 'development'
```

## 3. Dev-only affordances

All behind `devAuth.enabled` (or a `__DEV__` check) and stripped from release bundles by the Metro `transform.minify` dead-code path:

| Tool | Where | Purpose |
|---|---|---|
| Dev banner | root layout | prove you are in a dev build |
| User switcher | banner tap | swap between the three fixture households |
| Date override | dev menu | set "today" for the whole app so period, forecast and calendar features can be tested at any date. Pure functions already take `today` as a parameter (`docs/10`), so this is a single provider value, never a global `Date` monkey-patch |
| Mock aggregator | `EXPO_PUBLIC_BANK_ADAPTER=mock` | run the whole bank flow with fixtures, no provider account needed |
| Seed reset | dev menu | drop and reseed the local SQLite mirror |
| Slow network | dev menu | 2s artificial latency on every query, to see real loading states |
| Force states | dev menu | force loading / empty / error / offline / stale on the current screen |
| SQLite inspector | Expo DevTools plugin | browse the device database live |

## 4. Fixture households

Seeded by `pnpm db:seed`, matching `docs/19` §3:

| Household | Login | Contents |
|---|---|---|
| Sanne | `dev@kwartje.local` | 1 ING account, income on the 24th, 6 months of transactions, 3 series, 2 potjes |
| Bram & Fleur | `dev2@kwartje.local` | joint + 2 personal accounts, toeslagen, gemeentebelasting instalments, income shares 60/40 |
| Youssef | `dev3@kwartje.local` | irregular ZZP income, business/private mix |

All fixture data is synthetic. Never commit a real bank export, including your own.

## 5. Scripts

| Script | Does |
|---|---|
| `pnpm dev` | Expo dev client |
| `pnpm dev:reset` | reset local db, reseed, clear MMKV + SQLite, start |
| `pnpm db:migrate` / `db:seed` / `db:reset` | Supabase local |
| `pnpm db:new <name>` | new timestamped migration |
| `pnpm typecheck` / `lint` / `lint:fix` | must both be clean before any commit |
| `pnpm test` / `test:watch` / `test:cov` | Jest |
| `pnpm test:db` | pgTAP |
| `pnpm test:e2e` | Maestro against a local dev build |
| `pnpm check` | typecheck + lint + knip + test — **run this before every commit** |
| `pnpm i18n:check` | fails on missing keys, unused keys, or literal strings in TSX |
| `pnpm lines:check` | fails on any source file over 400 lines |

## 6. Git hooks

`husky` + `lint-staged`:
- pre-commit: `eslint --fix`, `prettier --write`, `pnpm lines:check` on staged files
- pre-push: `pnpm check`

Hooks may be skipped locally with `--no-verify`, but CI runs the same checks and will fail the PR.
