---
description: Build a screen from its spec, with all required states
---

Build the screen `$1`.

1. Read its section in `docs/11-screens-spec.md` and its route in `docs/05-information-architecture.md`. Quote the spec section you are implementing.
2. Read `.claude/rules/06-ui-and-styling.md`.
3. Implement in this order:
   - `TEXT` + `TEST_ID` + props/view-model types
   - the query hooks it needs (existing ones if possible)
   - sub-components in `components/`, one per file
   - the screen file, composition only, under 200 lines
4. Implement **all six states** from `docs/11` §State matrix: loading (skeleton matching the layout), empty (teaches + one action), error (mapped message + retry), offline, stale, success.
5. Add every string to `nl.json` and `en.json`.
6. Verify: light and dark, 100% and 200% font scale, VoiceOver order, 44pt targets.
7. Add component tests: renders empty, renders data, renders error.
8. Run `pnpm check`, then walk `.claude/rules/10-review-checklist.md`.
