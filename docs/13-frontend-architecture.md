# 13 — Frontend architecture

## 1. Bootstrap

```bash
pnpm dlx create-expo-app@latest apps/mobile --template blank-typescript
cd apps/mobile
pnpm expo install expo-router expo-secure-store expo-local-authentication expo-localization \
  expo-sqlite expo-web-browser expo-notifications expo-haptics expo-image expo-file-system \
  react-native-reanimated react-native-gesture-handler react-native-screens react-native-safe-area-context \
  react-native-mmkv @shopify/flash-list react-native-svg
pnpm add @tanstack/react-query zustand drizzle-orm zod react-hook-form @hookform/resolvers \
  i18next react-i18next date-fns @date-fns/tz @supabase/supabase-js @gorhom/bottom-sheet \
  lucide-react-native victory-native react-native-purchases @sentry/react-native
pnpm add -D drizzle-kit jest-expo @testing-library/react-native eslint prettier knip typescript
```

`app.json` essentials:
```jsonc
{
  "expo": {
    "name": "Kwartje", "slug": "kwartje", "scheme": "kwartje",
    "newArchEnabled": true,
    "experiments": { "typedRoutes": true, "reactCompiler": true },
    "ios":     { "bundleIdentifier": "nl.kwartje.app", "supportsTablet": false,
                 "associatedDomains": ["applinks:kwartje.nl"],
                 "infoPlist": { "NSFaceIDUsageDescription": "Om je financiële gegevens te beschermen." } },
    "android": { "package": "nl.kwartje.app", "intentFilters": [{ "action":"VIEW", "data":[{"scheme":"https","host":"kwartje.nl","pathPrefix":"/bank"}], "category":["BROWSABLE","DEFAULT"] }] },
    "plugins": ["expo-router","expo-secure-store","expo-localization","expo-sqlite",
                ["expo-local-authentication",{"faceIDPermission":"Om je financiële gegevens te beschermen."}],
                "@sentry/react-native/expo"]
  }
}
```

`tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, paths `@/* → src/*`, `@shared/* → ../../packages/shared/*`.

## 2. Provider tree (`app/_layout.tsx`)

```
<GestureHandlerRootView>
  <SafeAreaProvider>
    <QueryClientProvider>          // persisted to MMKV, gcTime 24h
      <ThemeProvider>              // tokens, colour scheme
        <I18nProvider>             // i18next, nl default
          <AuthProvider>           // supabase session, refresh
            <AppLockGate>          // biometric gate, blurs content in app switcher
              <DatabaseProvider>   // expo-sqlite + drizzle, runs migrations
                <SyncProvider>     // outbox flush, foreground refresh, netinfo
                  <BottomSheetModalProvider>
                    <Stack />
```

Order matters: theme before i18n (theme has no deps), auth before database (db is scoped per user), sync last.

## 3. State ownership

| Kind of state | Owner | Never |
|---|---|---|
| Server data (transactions, budgets, envelopes) | react-query, keyed by household+period | in zustand |
| Offline mirror | SQLite via drizzle, read through react-query `queryFn` | duplicated in memory |
| Session / auth | `AuthProvider` context + secure-store | in MMKV |
| UI state (filters, selection, sheet open) | zustand slices, non-persisted | in react-query |
| User preferences (theme, quiet hours) | MMKV + zustand persisted slice | on the server only |
| Form state | react-hook-form | in zustand |

Query key factory (`src/features/*/queries/keys.ts`):
```ts
export const keys = {
  all: ['kwartje'] as const,
  household: (h: string) => [...keys.all, 'h', h] as const,
  transactions: (h: string, f: TxFilter) => [...keys.household(h), 'txns', f] as const,
  period: (h: string, p: string) => [...keys.household(h), 'period', p] as const,
  safeToSpend: (h: string, p: string) => [...keys.period(h, p), 'sts'] as const,
  envelopes: (h: string) => [...keys.household(h), 'envelopes'] as const,
  forecast: (h: string, days: number) => [...keys.household(h), 'forecast', days] as const,
};
```

Defaults: `staleTime: 60_000`, `gcTime: 24h`, `retry: 2` with exponential backoff, `refetchOnWindowFocus: false` (mobile), `refetchOnReconnect: true`.

## 4. Data access layer

Every read goes through a repository in `src/features/<x>/queries/`. A repository:
1. reads from SQLite (instant),
2. returns it,
3. kicks a background fetch from Supabase,
4. writes the result back to SQLite,
5. invalidates the query key.

```ts
export function useTransactions(filter: TxFilter) {
  const { householdId } = useHousehold();
  return useQuery({
    queryKey: keys.transactions(householdId, filter),
    queryFn: async () => {
      const local = await localTransactions(filter);
      void refreshTransactions(filter);          // fire-and-forget, invalidates on completion
      return local;
    },
  });
}
```

**Rule**: components never call `supabase` directly. Ever.

## 5. Local database

Drizzle schema in `src/db/schema.ts`, mirroring `docs/06` §10. Migrations generated with `drizzle-kit` and applied on app start inside `DatabaseProvider` before children render.

Indexes on the device mirror: `(booked_at desc)`, `(category_id, booked_at)`, `(account_id, booked_at)`, plus an FTS5 virtual table on `description_clean || counterparty_name` for instant search.

Retention: keep 24 months of transactions locally; older data is fetched on demand and not cached.

## 6. Offline & sync

**Reads** are always served from SQLite, so every screen works offline.

**Writes** go through `mutate()` which:
1. applies the change to SQLite immediately (optimistic),
2. appends an `outbox` row,
3. updates the react-query cache,
4. triggers a flush if online.

`flushOutbox()` runs on: reconnect, app foreground, after any mutation, and every 60s while active. It processes rows in insertion order, with per-row retry and exponential backoff; a row failing 5 times is parked and surfaced in settings as "1 wijziging kon niet worden opgeslagen" with a retry action.

**Conflict resolution** (per `docs/06` §10): server wins for bank-derived fields; client wins for `category_id` when `category_source='user'`, `note`, `tags`, splits, `is_excluded`. Resolved field-by-field, `updated_at` breaks ties. Never last-write-wins on the whole row.

## 7. Performance rules

- `FlashList` with a correct `estimatedItemSize` for any list over 50 rows.
- Row components are `memo`'d with stable props; never pass inline objects or closures as props into list rows.
- Money formatting is memoised per (cents, locale) in a small LRU — `Intl.NumberFormat` construction is expensive; construct formatters once at module scope.
- Heavy aggregation happens in SQL (SQLite or Postgres), never in JS over thousands of rows.
- Reanimated worklets for anything that animates on scroll; no `setState` in scroll handlers.
- The React Compiler is enabled; do not hand-write `useMemo`/`useCallback` unless profiling proves a need.
- Startup budget: **TTI < 1.5s** on an iPhone 12 / Pixel 6a with 10k local transactions. Measure in CI with a Maestro startup trace.

## 8. Error handling

```ts
export class AppError extends Error {
  constructor(readonly code: ErrorCode, readonly meta?: Record<string, unknown>) { super(code); }
}
```
- A single `ErrorBoundary` per tab stack, plus a root one.
- `useErrorToast()` maps `code` → localised message via `errors.<code>` in i18n, with a generic fallback.
- Sentry `beforeSend` strips: `description_raw`, `description_clean`, `counterparty_name`, `note`, `tags`, `amount_cents`, any key matching `/iban|amount|balance|name/i`. Verified by a unit test.

## 9. Feature module template

```
src/features/potjes/
├── index.ts              # public barrel
├── types.ts
├── logic/
│   ├── contribution.ts   # pure, 100% covered
│   └── contribution.test.ts
├── queries/
│   ├── keys.ts
│   ├── useEnvelopes.ts
│   └── useCreateEnvelope.ts
├── components/
│   ├── EnvelopeCard.tsx
│   └── EnvelopeRing.tsx
└── screens/
    ├── PotjesScreen.tsx
    └── PotjeDetailScreen.tsx
```

`app/(tabs)/potjes/index.tsx` is then:
```tsx
import { PotjesScreen } from '@/features/potjes';
export default PotjesScreen;
```

## 10. Environment & config

- `app.config.ts` reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` only. **No other secret is ever `EXPO_PUBLIC_`.**
- Environments: `development` (local Supabase), `preview` (staging project), `production`. Selected by EAS build profile.
- A CI check fails the build if any env var matching `/secret|private|service_role|client_secret/i` appears with an `EXPO_PUBLIC_` prefix.
