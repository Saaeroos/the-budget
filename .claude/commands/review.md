---
description: Review the current diff against the project rules and specs
---

Review the current changes (`git diff main...HEAD`).

Go through `.claude/rules/10-review-checklist.md` item by item against the actual diff. For each violation report: the file and line, the rule it breaks, and the concrete fix — not a general observation.

Then check the diff against the specs the ticket claims to implement (`docs/22-task-backlog.md` names them). Flag any behaviour that differs from the spec and is not recorded in `DECISIONS.md`.

Rank findings: **blocking** (rule violation, spec deviation, missing test, security or privacy issue) before **suggestion** (naming, structure, clarity). Do not pad the list — if the diff is clean, say so.
