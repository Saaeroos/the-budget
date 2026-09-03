# Rule 01 — Architecture & file layout

## Layers, and the only allowed direction of dependency

```
app/            routes — composition only
  ↓
features/       screens, components, queries, logic   (feature-first)
  ↓
ui/             design-system primitives — no business meaning
  ↓
lib/            money, dates, formatters, errors, supabase client
  ↓
packages/shared contracts (zod), pure domain logic shared with edge functions
```

An arrow means "may import from". **No upward imports. No sideways imports between features except through a feature's public barrel.**

- `app/**` may import only from `features/*` barrels.
- `features/a` may import `features/b` only via `features/b/index.ts`. Deep imports are a lint error.
- `ui/**` may import from `lib/**` and nothing else. It may never import a feature, a query, or a store.
- `lib/**` imports nothing from the app.
- `packages/shared/**` imports nothing from `apps/**` — it runs in Deno too.

## Feature module shape

```
features/<feature>/
├── index.ts                 # the public barrel — the ONLY entry point
├── types.ts                 # domain types for this feature
├── text.ts                  # feature-level TEXT if shared across files
├── logic/                   # pure functions + their tests, 100% branch coverage
├── queries/
│   ├── keys.ts              # query key factory
│   ├── use<Thing>.ts        # one query hook per file
│   └── use<Action>.ts       # one mutation hook per file
├── components/              # presentational, feature-aware
└── screens/                 # one screen per file, composition only
```

`index.ts` exports only what other features and routes need. If everything is exported, the barrel is doing nothing.

## Screens

A screen file composes. It may:
- call query/mutation hooks,
- render components,
- handle navigation.

It may **not**:
- contain business math (that is `logic/`),
- contain layout primitives (that is `ui/`),
- exceed 200 lines (screens are the strictest case of the 400-line rule).

## Naming

| Thing | Convention | Example |
|---|---|---|
| Component file | PascalCase | `EnvelopeCard.tsx` |
| Hook file | camelCase, `use` prefix | `useEnvelopes.ts` |
| Logic file | kebab-case | `monthly-contribution.ts` |
| Test file | sibling, `.test.ts` | `monthly-contribution.test.ts` |
| Type | PascalCase, no `I` prefix | `Envelope`, `EnvelopeCardProps` |
| Enum-like | `as const` object + derived union | see `02-text-and-types.md` |
| Boolean | `is`/`has`/`can` prefix | `isBehind`, `canContribute` |
| Handler | `handle` prefix in the component, `on` prefix in the prop | `onPress` → `handlePress` |

## Exports

Named exports only. The single exception is a route file under `app/`, which expo-router requires to default-export:

```tsx
// app/(tabs)/potjes/index.tsx
import { PotjesScreen } from '@/features/potjes';
export default PotjesScreen;
```

No `export default` anywhere else. No barrel re-export of a whole directory (`export * from './components'`) — list what is public explicitly.

## Where things must NOT live

| Never put… | …here | Put it here |
|---|---|---|
| Business math | a component | `features/*/logic/` |
| A `supabase` call | a component or screen | `features/*/queries/` |
| A string literal | anywhere | a `TEXT` object |
| A colour or spacing value | a component | `ui/tokens.ts` |
| Server data | zustand | react-query |
| A query hook | `ui/` | `features/*/queries/` |
| A `useEffect` that fetches | anywhere | react-query |
