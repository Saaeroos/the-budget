# CLAUDE.md — operating manual for the AI coder

You are implementing **Kwartje**, a Dutch-market budgeting app. This file overrides your defaults. Read it fully before writing code.

**Then read `.claude/rules/` in numeric order — every file in it is binding.** This document is the summary; `.claude/rules/` is the detail. `docs/` is the specification of *what* to build; `.claude/rules/` is the specification of *how* to write it.

---

## 1. Prime directives

1. **The specs in `docs/` are the source of truth.** Do not invent product behaviour, copy, category names, or math. If it is not in the specs, it is not in scope.
2. **Dutch first.** Every user-facing string is added to `nl` before `en`. Never hardcode a user-facing string in a component.
3. **The four-bucket model is the core abstraction.** Vaste lasten / Reserveringsuitgaven / Huishoudelijke uitgaven / Vrij besteedbaar. See `docs/10-budget-engine.md`. Do not implement a generic envelope system.
4. **Money is never a float.** Store and compute in integer cents (`bigint` in Postgres, `number` of cents in TS). Format only at the render boundary.
5. **No secret ever reaches the device.** Aggregator client IDs, private keys, service-role keys live in Supabase Edge Function secrets only.
6. **EU data residency.** Supabase project region `eu-central-1`. No third-party SDK that ships financial data to the US.
7. **No file over 400 lines.** Split instead of exceeding. Screens stop at 200. → `.claude/rules/03-file-size.md`
8. **No hardcoded strings, ever.** Every file declares a `TEXT` object of i18n keys at the top, then its types and interfaces, then the implementation. → `.claude/rules/02-text-and-types.md`
9. **SOLID, concretely.** One reason to change per module; extend by registration, not by editing; depend on injected abstractions; `today` is always a parameter. → `.claude/rules/04-solid.md`
10. **TanStack Query owns server state; Zustand owns UI state.** Never the reverse. → `.claude/rules/05-state-management.md`

---

## 2. Stack — pinned decisions

| Concern | Decision | Do not substitute |
|---|---|---|
| Framework | Expo SDK 55 (RN 0.83, React 19.2), New Architecture only | No bare RN, no Expo Go for release builds |
| Routing | `expo-router` v7, typed routes on | No React Navigation directly |
| Language | TypeScript, `strict: true`, `noUncheckedIndexedAccess: true` | No `any`. Use `unknown` + zod |
| Server | Supabase (Postgres 16, RLS, Auth, Edge Functions on Deno, pg_cron) | No Firebase |
| Local DB | `expo-sqlite` + `drizzle-orm` | No WatermelonDB, no Realm |
| Server state | `@tanstack/react-query` v5 | No Redux, no RTK Query |
| Client state | `zustand` (UI/session only) | Never store server data in zustand |
| Storage | `react-native-mmkv` (prefs), `expo-secure-store` (tokens) | No AsyncStorage |
| Forms | `react-hook-form` + `zod` resolver | — |
| Validation | `zod` schemas shared in `packages/shared` | Validate at every boundary |
| Charts | `victory-native` (Skia) + `react-native-svg` | No web chart libs |
| Lists | `@shopify/flash-list` v2 | Not `FlatList` for >50 rows |
| Animation | `react-native-reanimated` v4 + `react-native-gesture-handler` | No `Animated` API |
| Bottom sheets | `@gorhom/bottom-sheet` v5 | — |
| Icons | `lucide-react-native` | — |
| Dates | `date-fns` + `date-fns/locale/nl` + `@date-fns/tz` | No moment, no dayjs |
| i18n | `i18next` + `react-i18next` + `expo-localization` | — |
| Payments | `react-native-purchases` (RevenueCat) | No direct StoreKit |
| Errors | `@sentry/react-native` (EU DSN, PII scrubbed) | — |
| Analytics | PostHog EU (`eu.posthog.com`), events only, no PII | No Firebase Analytics, no Amplitude US |
| Tests | `jest-expo` + `@testing-library/react-native`, `maestro` for E2E, `pgTAP` for RLS | — |
| Lint | ESLint flat config + `@typescript-eslint` + `eslint-plugin-unicorn`, Prettier, `knip` | — |

---

## 3. Repository layout

```
budget/
├── apps/
│   └── mobile/                 # the Expo app
│       ├── app/                # expo-router routes ONLY (thin)
│       ├── src/
│       │   ├── features/       # feature-first: budget/, transactions/, banks/, ...
│       │   │   └── <feature>/
│       │   │       ├── components/
│       │   │       ├── hooks/
│       │   │       ├── queries/      # react-query hooks
│       │   │       ├── logic/        # pure functions, 100% unit-tested
│       │   │       └── types.ts
│       │   ├── db/             # drizzle schema, migrations, client
│       │   ├── ui/             # design system primitives (no business logic)
│       │   ├── lib/            # supabase client, money, dates, formatters
│       │   ├── i18n/           # nl.json, en.json, index.ts
│       │   └── store/          # zustand slices
│       └── assets/
├── packages/
│   └── shared/                 # zod schemas + TS types shared app<->edge functions
├── supabase/
│   ├── migrations/             # timestamped SQL, forward-only
│   ├── functions/              # edge functions (Deno)
│   ├── seed/                   # categories, merchants, NL reference data
│   └── tests/                  # pgTAP
└── docs/                       # the specs — read-only for you
```

Rules:
- `app/` files contain **only** route composition. No business logic, no queries.
- No file exceeds **400 lines**; screens stop at 200; functions at 50. `pnpm lines:check` enforces this in CI and in the pre-commit hook.
- Business math lives in `features/<x>/logic/` as pure functions with no React and no I/O. These must be unit-tested.
- `ui/` components know nothing about money semantics, only props.
- Cross-feature imports go through a feature's `index.ts` barrel. No deep imports.

---

## 4. Coding conventions

Full detail in `.claude/rules/`. The summary:

### File template (mandatory shape)

```tsx
import { ... } from '...';

/* ── Text ─────────────────────────────────── */
const TEXT = { title: 'potjes.title', behind: 'potjes.behind' } as const;
const TEST_ID = { card: 'envelope-card' } as const;

/* ── Types ────────────────────────────────── */
export interface EnvelopeCardProps { readonly envelope: Envelope; readonly onPress: (id: string) => void; }

/* ── Implementation ───────────────────────── */
export function EnvelopeCard({ envelope, onPress }: EnvelopeCardProps) { ... }
```

`TEXT` holds **i18n keys**, never Dutch text — the copy lives in `src/i18n/nl.json`. No string literal may appear anywhere else in a file: not in JSX, not in a log, not in a throw, not in an `accessibilityLabel`, not in a `testID`. The same applies to unexplained numbers — name them in a `LIMITS` const.

- **No `any`, no `enum`, no `I`-prefixed interfaces, no default exports** outside `app/` route files. Use `as const` objects with derived unions instead of enums, and branded primitives (`Cents`, `NLDate`, `HouseholdId`) for anything that must not be mixed up.
- **Naming**: `PascalCase` components, `camelCase` functions/vars, `SCREAMING_SNAKE` consts, `kebab-case` files except components (`TransactionRow.tsx`).
- **Exports**: named exports only, except route files (expo-router requires default).
- **Components**: function declarations, props typed inline as `type Props = {...}`. No `React.FC`.
- **Money type**: `type Cents = number & { readonly __brand: 'Cents' }`. Helpers in `lib/money.ts`: `cents()`, `add()`, `sub()`, `mul()`, `pct()`, `formatEUR()`. Never `toFixed` on money.
- **Dates**: all persisted timestamps are UTC `timestamptz`. All *business dates* (booking date, budget period bounds) are `date` in `Europe/Amsterdam`. Convert at the edge, never in components.
- **Errors**: throw `AppError` (`lib/errors.ts`) with a `code` from the union in `docs/14-api-contracts.md`. UI maps `code` → localised message.
- **Async**: no floating promises. All react-query keys come from `queries/keys.ts` factories.
- **Accessibility**: every touchable has `accessibilityLabel` (localised) and a ≥44pt hit target. Test with dynamic type at 200%.
- **Comments**: explain *why*, never *what*. No comment blocks describing obvious code.

---

## 5. Definition of Done (per ticket)

A ticket is done only when all of these hold:

- [ ] Implements exactly the referenced spec sections; deviations documented in the PR body.
- [ ] `pnpm typecheck` and `pnpm lint` pass with zero warnings.
- [ ] Pure logic has unit tests covering the happy path + every edge case listed in the spec.
- [ ] Any new table/column has a migration **and** RLS policies **and** a pgTAP test proving cross-tenant isolation.
- [ ] All new strings exist in `nl.json` and `en.json`; no literal user-facing text in TSX.
- [ ] Screen states implemented: loading, empty, error, offline, success (see `docs/11-screens-spec.md` §State matrix).
- [ ] Works with VoiceOver/TalkBack and at 200% font scale without clipping.
- [ ] Light and dark theme both verified.
- [ ] No secret, key, IBAN, or account name in logs or Sentry payloads.

---

## 6. Ambiguity protocol

When a spec is unclear or two specs conflict:

1. Prefer the more specific document (e.g. `10-budget-engine.md` beats `04-features.md` on budget math).
2. Prefer the Dutch-market behaviour over the generic one.
3. Choose the option that is reversible and least surprising to the user.
4. Write your decision into `docs/DECISIONS.md` as `## YYYY-MM-DD — <topic>` with *Context / Options / Decision / Consequence*.
5. Continue. Do not block, do not silently guess without recording it.

---

## 7. Hard prohibitions

- Do **not** add a dependency not listed in §2 without recording a decision entry and justifying bundle cost.
- Do **not** call the aggregator API from the app. Ever.
- Do **not** log, Sentry-capture, or analytics-track: IBANs, account holder names, transaction descriptions, amounts, or merchant names.
- Do **not** implement credit scoring, lending, investment advice, or anything that would need an AFM advice licence. Kwartje shows facts, never recommends financial products.
- Do **not** use `SELECT *` in edge functions or client queries — always explicit columns.
- Do **not** write migrations that drop or rewrite user data without a documented backfill.
- Do **not** ship a screen without its empty state.

---

## 8. Local development

`pnpm dev` must land on **Vandaag with fixture data and no login screen**. The dev auth bypass is guarded by three independent conditions (`__DEV__` + `EXPO_PUBLIC_ENV=development` + `EXPO_PUBLIC_SKIP_AUTH=1` + a localhost Supabase URL) and signs in to the *local* Supabase with a seeded account, so RLS is still exercised. It skips the screen, never the authorisation. A persistent dev banner makes it unmistakable. Full detail and the dev-only tooling (date override, mock aggregator, forced states, user switcher) in `docs/24-local-dev.md`.

Never fake a session object and never disable RLS to make development easier.

## 9. Working rhythm

- Ship one ticket per branch: `feat/KW-014-transaction-list`.
- Commit style: Conventional Commits (`feat(budget): add rollover carry mode`).
- After each ticket, update its checkbox in `docs/22-task-backlog.md`.
- Before starting a milestone, re-read `docs/21-roadmap.md` for its exit gate.
- Before every commit: `pnpm check` (typecheck, lint, knip, tests, line-length, i18n).
- Before every PR: walk `.claude/rules/10-review-checklist.md` against your own diff.

## 10. Where to look

| Question | File |
|---|---|
| What am I building? | `docs/00-INDEX.md` |
| How do I write it? | `.claude/rules/00-core.md` |
| What is the next ticket? | `docs/22-task-backlog.md` |
| How do I run it locally? | `docs/24-local-dev.md` |
| What did we decide and why? | `docs/DECISIONS.md` |
