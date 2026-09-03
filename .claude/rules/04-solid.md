# Rule 04 — SOLID, applied to a React Native codebase

SOLID is not academic here. Each principle maps to a concrete, checkable rule.

## S — Single responsibility

> A module has exactly one reason to change.

- A component either **fetches** or **renders** — never both. Screens fetch, components render.
- A file that would need editing for a copy change *and* a math change *and* a layout change is three files.
- `logic/monthly-contribution.ts` changes only when the contribution math changes. Not when the card design changes.

**Check**: can you name the file's single responsibility in one sentence without "and"? If not, split it.

## O — Open/closed

> Extend by adding, not by editing.

- New categorisation stage → a new stage module registered in the pipeline array. Never a new `if` in a 200-line function.
- New bank → a new adapter implementing `AggregatorAdapter`. Never a `switch (provider)` sprinkled through the sync engine.
- New import format → a new parser registered in the parser map, satisfying `(text: string) => RemoteTransaction[]`.
- New notification type → a new entry in the catalogue with an evaluator function. Never a new branch in the dispatcher.

**Check**: adding the second, third and fourth of something must touch only registration, never the engine.

## L — Liskov substitution

> Any implementation of an interface must be usable without the caller knowing which one it is.

- Every `AggregatorAdapter` returns the same normalised shapes and throws the same `AppError` codes. `MockAggregatorAdapter` is not a toy — it satisfies the identical contract, which is why it can drive the E2E suite.
- A contract test suite runs against **every** implementation of an interface. If a new adapter needs a special case in the sync engine, the interface is wrong, not the engine.

## I — Interface segregation

> No consumer depends on methods it does not use.

- Split fat interfaces: `TransactionReader` and `TransactionWriter` rather than one `TransactionRepository` that every component drags in.
- Component props are the interface a component exposes. Do not pass a whole `Transaction` when the row needs `{ amount, merchantName, categoryId }` — pass a view model.
- Hooks return the minimum: `{ data, isLoading, error }`, not the entire react-query result object, unless the caller genuinely needs it.

## D — Dependency inversion

> Depend on abstractions, and inject them.

- `logic/` functions take data as parameters. They never import a query hook, a store, `Date`, or `supabase`.
- The current date is **always a parameter** (`today: NLDate`). This is what makes the dev date-override in `docs/24` §3 possible and what makes the time-dependent tests deterministic.
- Edge functions receive their adapter through a factory (`getAdapter(env)`), never by importing a concrete module at the call site.
- Providers inject: `DatabaseProvider` supplies the drizzle client, `AuthProvider` the session. Nothing reaches for a module-level singleton.

**Check**: can this function be unit-tested with no mocks at all? If it needs a mock, it probably has a hidden dependency that should be a parameter.

## Composition over inheritance

No class hierarchies in app code. Classes are allowed for exactly two things: `AppError` (needs `instanceof`), and adapter implementations where a base class removes real duplication. Everything else is functions and objects.

## The practical test

Before opening a PR, ask:
1. If the designer changes the card layout, which files change? (Should be one.)
2. If we add a second aggregator, which files change? (Should be: one new file, one registration line.)
3. If the copy changes, which files change? (Should be: `nl.json`, `en.json`.)
4. If the contribution formula changes, which files change? (Should be: one logic file and its test.)

If any answer is "several", the design violates SOLID and must be reworked before the PR.
