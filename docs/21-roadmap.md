# 21 — Roadmap

Each milestone has an **exit gate**. Do not start the next milestone until the gate is met.

---

## M0 — Foundation (weeks 1–2)
Repo, Expo app, design system primitives, Supabase project, auth, local SQLite mirror, CI, dev auth bypass.

**Gate**: app builds on both platforms; a signed-in user sees an empty Vandaag; CI is green; `pnpm dev` works offline with the fixture household and no login.

## M1 — Manual money (weeks 3–5)
Categories seed, manual transactions, transaction list + search + filters, four-bucket budget, budget editing, period engine, Overzicht.

**Gate**: a user can run a full month manually. `docs/10` §11 test matrix fully green.

## M2 — Potjes & the number (weeks 6–7)
Envelopes, contributions, behind/ahead math, Veilig te besteden with its explainer sheet, forecast v1 (14 days).

**Gate**: the hero number is correct against all fixture households and explainable line by line.

## M3 — Bank sync (weeks 8–11)
Aggregator adapter, connect flow, consent lifecycle, sync engine, dedupe, pending reconciliation, transfers, Rekeningen screens.

**Gate**: initial + incremental sync against the mock adapter and one real Dutch bank account; re-sync produces zero duplicates; consent expiry and renewal preserve user edits.

## M4 — Intelligence (weeks 12–14)
Categorisation pipeline, merchant dictionary (250 merchants), rules editor, learning from corrections, recurring detection, Abonnementenradar with Wet Van Dam surfacing, review queue.

**Gate**: ≥88% accuracy on the 500-transaction labelled fixture; review queue clears 50 transactions in under 2 minutes of tapping.

## M5 — Dutch layer (weeks 15–16)
Splits + Tikkie/Wero reconciliation, custom period start, notifications, widgets, full nl copy pass, accessibility pass.

**Gate**: all 8 E2E flows green; accessibility audit signed off; copy review checklist green.

## M6 — Beta (weeks 17–19)
Closed beta with 50 consenting users. Monetisation plumbing, paywall, export, privacy screens, DPIA, legal sign-off.

**Gate**: crash-free ≥99.5%; sync health ≥95%; activation ≥45% in beta; legal gate cleared.

## M7 — Launch v1.0 (week 20)
Store submission, status page, support, marketing site.

**Gate**: `docs/20` §8 launch checklist complete.

---

## Post-launch

**v1.1 (+4 weeks)** — F-07 import (CSV/MT940/CAMT), F-08 export formats, F-35 rollover modes, F-36 90-day forecast, F-39 budget templates.

**v1.2 (+8 weeks)** — **F-13 Toeslagen**, F-14 vakantiegeld planner, F-16 eigen risico, F-22 Nibud benchmark. The Dutch differentiators land together as one "Nederlandse kalender" release.

**v1.3** — F-15 jaarafrekening, F-18 gemeentebelasting, F-28 feestdagenpotje, F-12 net worth, F-25 four-week rhythm.

**v2.0** — F-19 autokosten, F-20 DUO, F-23 aangifte helper, F-24 huurverhoging, F-27 kinderbijslag, F-29 Nibud PDF, F-34 BTW-potje + ZZP mode, F-47 receipts.

**v3 exploratory** — F-55 Ask Kwartje, F-53 year in review, F-38 round-ups, web companion, bunq deep adapter.

---

## Sequencing rationale

- Manual money before bank sync: the whole product must work without a bank, and building sync first hides model mistakes behind plumbing.
- The hero number before intelligence: if "veilig te besteden" is wrong, no amount of categorisation quality saves the product.
- Toeslagen after launch: highest differentiation but highest copy/legal risk; it deserves a release of its own with proper review.
- ZZP in v2: a different persona with a different budget model; adding it early would blur the product.
