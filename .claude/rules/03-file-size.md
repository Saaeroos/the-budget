# Rule 03 — File size and function size

## Hard limits

| Unit | Limit | Enforced by |
|---|---|---|
| Any source file | **400 lines** | `pnpm lines:check`, CI, pre-commit hook |
| Screen file | 200 lines | review |
| Component file | 200 lines | review |
| Function | 50 lines | eslint `max-lines-per-function` |
| Function parameters | 3 (then take an object) | eslint `max-params` |
| Cyclomatic complexity | 10 | eslint `complexity` |
| Nesting depth | 3 | eslint `max-depth` |
| JSX nesting depth | 5 | review |

Blank lines and comments count. The limit is about how much a reader must hold in their head, and a 900-line file with 300 blank lines is still a 900-line file.

Migrations and generated files (`*.gen.ts`, drizzle output, `nl.json`) are exempt — listed explicitly in `scripts/lines-check.mjs`.

## What to do when you hit the limit

Do not raise the limit. Split. In order of preference:

1. **Extract pure logic.** A 400-line component is usually a 120-line component and 280 lines of math that belongs in `logic/`.
2. **Extract sub-components.** A list row, a header, a footer, an empty state — each its own file in `components/`.
3. **Extract hooks.** `useEnvelopeForm`, `useTransactionFilters` — one concern per hook, one hook per file.
4. **Split the query layer.** One query or mutation per file. `useEnvelopes.ts`, `useCreateEnvelope.ts`, `useUpdateEnvelope.ts` — not one `envelopeQueries.ts`.
5. **Split the module.** If a feature folder has 30 files, it is probably two features.

## Anti-patterns that produce large files

| Smell | Fix |
|---|---|
| A screen that renders five different sections inline | One component per section |
| A component with 12 props | It is doing several jobs; split it, or pass one object with a named type |
| A `switch` over a domain union inside JSX | A map from union member → component |
| Repeated conditional styling blocks | A variant prop resolved in `ui/` |
| A `utils.ts` that grows forever | One file per concern, named after the concern |
| A `types.ts` with 40 unrelated types | Types live with the feature that owns them |

## Comments

Comments explain *why*, never *what*. Section markers (`/* ── Types ── */`) are allowed and encouraged because they make the top-of-file structure scannable. Delete commented-out code; git remembers it.
