# Rule 09 — Git, commits and pull requests

## Branches

One ticket per branch: `feat/KW-031-safe-to-spend`, `fix/KW-118-pending-merge`, `chore/KW-004-i18n-lint`.
Never work on `main`. Never bundle two tickets.

## Commits

Conventional Commits, imperative, scoped to a feature:

```
feat(potjes): add monthly contribution calculation
fix(sync): preserve user category when merging pending into booked
refactor(ui): split TransactionRow out of TransactionList
test(budget): cover rollover with a negative carry
chore(deps): add drizzle-kit
docs(decisions): record aggregator choice
```

- One logical change per commit. A commit that touches 14 files across 4 features is not one change.
- The body explains *why*, if it is not obvious. Reference the ticket: `Refs KW-031`.
- Never commit commented-out code, `console.log`, `.only` in a test, or a `TODO` without a ticket number.

## Pull requests

Template:

```md
## KW-0xx — <title>

**Specs implemented**: docs/10 §5, docs/11 §2

**What changed**
- …

**Deviations**
- None. (Or: link the DECISIONS.md entry.)

**Definition of Done**
- [ ] typecheck + lint clean
- [ ] pure logic 100% branch covered
- [ ] migration + RLS + pgTAP (if schema touched)
- [ ] all strings in nl.json and en.json, none literal
- [ ] loading / empty / error / offline states implemented
- [ ] a11y: 200% type, VoiceOver, 44pt targets
- [ ] light + dark verified
- [ ] no C3 data in logs, Sentry or analytics

**Screenshots**: light + dark, 100% + 200% type
```

PRs stay under ~400 changed lines where the ticket allows. A large PR is a sign the ticket should have been split.

## Reviewing

Reviewers check, in this order: does it match the spec → does it match the rules → is it tested → is it accessible → is it small. Style nitpicks that the linter does not catch are suggestions, not blockers.
