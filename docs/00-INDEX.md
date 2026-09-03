# 00 — Index & reading order

## Reading order by task

| If you are… | Read, in order |
|---|---|
| Bootstrapping the repo | `CLAUDE.md` → `.claude/rules/` → 24 → 13 → 07 → 12 → 22 (KW-001…012) |
| Writing any code at all | `.claude/rules/00-core.md` first, then the rules for what you touch |
| Briefing a designer | 23 (copy the block, hand it over) |
| Building a screen | 11 (that screen) → 05 → 12 → 15 → 06 |
| Building budget math | 10 → 06 → 02 (§4 Nibud) → 19 (§Fixtures) |
| Building bank sync | 08 → 14 → 07 → 16 |
| Building categorisation | 09 → 02 (§6 merchants) → 06 |
| Writing copy | 15 → 03 → 02 (§9 tone) |
| Shipping | 20 → 19 → 18 → 16 |

## Document status

| Doc | Status | Owner of truth for |
|---|---|---|
| 01 product brief | Frozen | Positioning, principles, success metrics |
| 02 market NL | Frozen | Dutch facts, calendar, competitor landscape |
| 03 personas | Frozen | Users, jobs-to-be-done |
| 04 features | Frozen | Scope and priority (MoSCoW per release) |
| 05 IA | Frozen | Routes, navigation, screen inventory |
| 06 data model | Frozen | Entities, fields, invariants |
| 07 supabase schema | Frozen | DDL, RLS, RPC |
| 08 bank sync | Frozen | Aggregator contract, consent, sync algorithm |
| 09 categorisation | Frozen | Pipeline, rules, learning |
| 10 budget engine | Frozen | All budget/forecast math |
| 11 screens | Frozen | Per-screen behaviour and states |
| 12 design system | Frozen | Tokens, components, motion |
| 13 frontend arch | Frozen | Project setup, conventions |
| 14 API contracts | Frozen | Edge function I/O, error codes |
| 15 i18n NL | Frozen | Copy, formats, tone |
| 16 security/AVG | Frozen | Legal, privacy, crypto |
| 17 notifications | Frozen | Push, jobs, widgets |
| 18 monetisation | Frozen | Tiers, paywall, entitlements |
| 19 testing | Frozen | Test strategy, fixtures |
| 20 release/ops | Frozen | Build, deploy, monitor |
| 21 roadmap | Living | Milestones, gates |
| 22 backlog | Living | Tickets — tick them off as you go |
| 23 designer prompt | Frozen | Brief for the AI design agent |
| 24 local dev | Frozen | Setup, dev auth bypass, fixtures, scripts |
| DECISIONS.md | Living | Every deviation you make |

## Glossary (Dutch → app concept)

| Dutch | Meaning | App concept |
|---|---|---|
| Vaste lasten | Fixed recurring costs | Bucket 1 |
| Reserveringsuitgaven | Money set aside for irregular costs | Bucket 2 / *potjes* |
| Huishoudelijke uitgaven | Day-to-day household spending | Bucket 3 |
| Vrij besteedbaar | Free to spend / save | Bucket 4 |
| Huishoudboekje | Household ledger | The app itself |
| Potje | Jar / sub-savings pot | `envelope` |
| Toeslag | Means-tested government benefit | `benefit` |
| Vakantiegeld | Statutory 8% holiday allowance, paid in May | `income_event` |
| Jaarafrekening | Annual utility settlement | `obligation` (settlement) |
| Eigen risico | Health insurance deductible | `deductible_tracker` |
| Termijnbedrag | Monthly instalment (energy) | `recurring_series` |
| Tikkie | P2P payment request | `payment_request` |
| Betaalverzoek | Payment request (generic) | `payment_request` |
| Wet Van Dam | Law: subscriptions become monthly-cancellable after year 1 | `subscription.cancellable_from` |
| Kwijtschelding | Waiver of local taxes for low incomes | Hint in obligations |
| Overstapservice | Bank account switching service | Import edge case |
