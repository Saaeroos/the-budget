# Rule 10 — Self-review checklist

Run this against your own diff before you say a ticket is done. It takes two minutes and catches most of what a reviewer would send back.

## Structure
- [ ] No file over 400 lines; no screen over 200; no function over 50
- [ ] Every new file has `TEXT` (if it has strings) and its types at the top
- [ ] Types before implementation, `TEST_ID` for every testID
- [ ] No `any`, no `enum`, no `I`-prefixed interfaces, no default exports outside `app/`
- [ ] No deep imports across features
- [ ] Business math is in `logic/` and is pure
- [ ] Nothing in `ui/` imports a query, a store or a feature

## State
- [ ] Server data in react-query, UI state in zustand, no crossover
- [ ] Query keys come from a factory
- [ ] One query/mutation per file
- [ ] Zustand selectors are narrow (`useShallow` where needed)
- [ ] No `useEffect` that fetches

## Correctness
- [ ] Money is integer cents everywhere; no float arithmetic
- [ ] `today` is a parameter, not `new Date()`
- [ ] Distribution math uses `largestRemainder`, not naive rounding
- [ ] Every invariant the change touches (`docs/06` §11) still holds and has a test
- [ ] Pending transactions handled correctly (excluded from actuals, included in forecast)

## Copy & i18n
- [ ] Zero literal user-facing strings
- [ ] Every key exists in `nl.json` **and** `en.json` (`pnpm i18n:check` green)
- [ ] Dutch copy: `je/jij`, sentence case, no exclamation marks, no emoji, verbs on buttons
- [ ] Numbers rendered by the formatter, never concatenated

## States
- [ ] Loading skeleton matches the real layout
- [ ] Empty state teaches and offers one action
- [ ] Error state shows a mapped message and a way out
- [ ] Offline works and queues writes
- [ ] Stale-data banner where bank data is involved

## Accessibility
- [ ] 200% font scale, nothing clipped
- [ ] VoiceOver/TalkBack order correct, money read as speech
- [ ] 44pt targets
- [ ] Contrast ≥4.5:1 in both themes
- [ ] No colour-only meaning
- [ ] Reduced motion honoured

## Security & privacy
- [ ] No secret, key or real financial data in the diff
- [ ] New table → RLS + policies + pgTAP
- [ ] New payload field → Sentry scrubber updated + its test
- [ ] No C3 data in any analytics event
- [ ] No aggregator call from the app

## Tests
- [ ] `pnpm check` green
- [ ] New logic 100% branch covered
- [ ] Spec-named edge cases all present as tests
- [ ] No `.only`, no skipped tests, no snapshot of a component tree

## Housekeeping
- [ ] Ticket checkbox ticked in `docs/22-task-backlog.md`
- [ ] `DECISIONS.md` updated if you deviated from a spec
- [ ] No `console.log`, no commented-out code, no orphan TODO
