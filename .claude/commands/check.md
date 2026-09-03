---
description: Run the full local verification suite and fix what fails
---

Run `pnpm check`. Then, in order, fix everything that fails:

1. TypeScript errors — fix the types, never `any`, never `@ts-expect-error` without a comment naming the ticket that will remove it.
2. Lint errors — fix the code, not the rule. Do not add an eslint-disable without recording why in `DECISIONS.md`.
3. `pnpm lines:check` failures — split the file per `.claude/rules/03-file-size.md`, do not raise the limit.
4. `pnpm i18n:check` failures — add missing keys to both locales, remove orphans, replace literal strings with `TEXT` keys.
5. Failing tests — fix the code if the test is right, fix the test if the spec says the test is wrong. Never delete a failing test.
6. `knip` findings — delete dead code and unused dependencies.

Report what you changed. If something cannot be fixed without a product decision, stop and say exactly what decision is needed.
