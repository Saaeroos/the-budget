# Rule 00 — Core

These rules are binding on every line of code you write in this repository. They are not preferences.

1. **Specs decide behaviour, rules decide shape.** `docs/` says *what*; `.claude/rules/` says *how*.
2. **No file over 400 lines.** See `03-file-size.md`. `pnpm lines:check` enforces it.
3. **No hardcoded strings, ever.** Every file that renders or logs text declares a `TEXT` object at the top. See `02-text-and-types.md`.
4. **Types and interfaces at the top of the file**, immediately after imports and `TEXT`. See `02-text-and-types.md`.
5. **SOLID.** See `04-solid.md`. In practice this means: one reason to change per module, dependencies on interfaces, no god components.
6. **TanStack Query owns server state. Zustand owns UI state.** Never the other way round. See `05-state-management.md`.
7. **Money is integer cents.** Never a float, never a string, never formatted before the render boundary.
8. **Pure logic is pure.** No React, no I/O, no `Date.now()`, no `Math.random()` in `logic/` — the current date and any randomness are parameters.
9. **Nothing ships without its tests, its empty state and its Dutch strings.**
10. **When in doubt, make it smaller.** Smaller file, smaller function, smaller component, smaller PR.

## The order you work in

1. Read the ticket in `docs/22-task-backlog.md` and the spec sections it names.
2. Read the rules that apply to what you are about to touch.
3. Write the types and the `TEXT` object first.
4. Write the pure logic and its tests.
5. Wire the query/mutation layer.
6. Build the UI last, from existing `src/ui/` primitives.
7. Run `pnpm check`.
8. Tick the ticket, update `DECISIONS.md` if you deviated.

## When you get stuck

Do not guess silently and do not stall. Follow the ambiguity protocol in the root `CLAUDE.md` §6: pick the more specific spec, prefer the Dutch-market behaviour, choose the reversible option, write the decision down, continue.
