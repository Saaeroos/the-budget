---
description: Scaffold a new feature module following the project rules
---

Scaffold the feature module `$1` in `apps/mobile/src/features/$1/`.

Steps:
1. Read `.claude/rules/01-architecture.md` and `.claude/rules/02-text-and-types.md`.
2. Identify which `docs/` sections define this feature. State them before writing code.
3. Create the module skeleton:
   - `index.ts` — public barrel, export only what routes and other features need
   - `types.ts` — domain types, `readonly`, no `any`, no enums
   - `text.ts` — feature-level `TEXT` map of i18n keys, `as const`
   - `logic/` — pure functions with sibling `.test.ts`, 100% branch coverage
   - `queries/keys.ts` — hierarchical key factory
   - `queries/use<Thing>.ts` — one hook per file
   - `components/` — presentational only
   - `screens/` — composition only, under 200 lines
4. Add the i18n keys to `src/i18n/nl.json` and `src/i18n/en.json`.
5. Wire the route(s) in `app/` as thin re-exports.
6. Run `pnpm check`.

Do not write UI before the types, the `TEXT` map and the pure logic exist and pass their tests.
