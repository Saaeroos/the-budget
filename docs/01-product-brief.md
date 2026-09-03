# 01 — Product brief

## 1. One sentence

**Kwartje is a Dutch huishoudboekje for your phone that automatically splits your money into the four buckets Nibud uses, warns you before a bill breaks your month, and speaks Dutch like a Dutch person.**

## 2. The problem

Dutch households do not fail at budgeting because they overspend on lattes. They fail because of **timing and lumpiness**:

- Income is monthly (usually the 24th–25th), but the big costs are annual: gemeentebelasting in February, autoverzekering in March, jaarafrekening energie in spring, vakantie in July, Sinterklaas in November, zorgverzekering switching in December.
- Government money arrives and disappears on its own schedule: toeslagen around the 20th, kinderbijslag quarterly, vakantiegeld in May — and toeslagen have to be paid back when income changes.
- The biggest single financial shock for a Dutch household is not a purchase; it is a **terugvordering** (benefit clawback), a **jaarafrekening**, or an **eigen risico** bill arriving four months after the doctor's visit.

Existing apps either (a) are American mental models bolted onto euros, (b) are the user's own bank's app that only sees one bank, or (c) are spreadsheets nobody keeps up.

## 3. The insight

The Nibud model — the structure every Dutch budget coach, gemeente and debt counsellor already uses — is **the** native mental model:

1. **Vaste lasten** — what leaves automatically
2. **Reserveringsuitgaven** — what you must set aside for later
3. **Huishoudelijke uitgaven** — what you spend week to week
4. **Vrij besteedbaar** — what is genuinely yours

Bucket 2 is the one no international app models properly, and it is exactly the one that breaks Dutch budgets. Kwartje makes bucket 2 automatic: it knows the annual bills, computes the monthly set-aside, and shows a real "safe to spend" number.

## 4. Positioning

> **For** Dutch households who feel the month is fine until it suddenly isn't,
> **Kwartje** is a budgeting app
> **that** models money the way Nibud does — fixed, reserved, household, free —
> **unlike** YNAB, Monefy or your bank's own overview,
> **because** it connects every Dutch bank at once, knows the Dutch financial calendar, and tells you what you can safely spend today.

## 5. Product principles

1. **Answer one question on open**: *"How much can I safely spend?"* Everything else is a second screen.
2. **Predict, don't report.** A chart of last month is a receipt. A warning about the 14th of next month is a product.
3. **Dutch, not translated.** `je`, not `u`. €1.234,56. Week numbers. Direct, dry, no exclamation marks.
4. **Zero-guilt.** No red shaming, no streaks, no "you overspent!". Neutral language, actionable next step.
5. **Boring with money.** No investment tips, no credit, no BNPL partnerships, no ads, no data resale.
6. **Two minutes a week.** The app must be useful to someone who opens it for 20 seconds on the tram.
7. **Works without the bank.** Every automatic feature has a manual path — connections break, and people distrust them.

## 6. Success metrics

| Metric | Definition | Target at 6 months |
|---|---|---|
| Activation | % of new users who connect ≥1 bank *or* enter ≥5 transactions within 7 days | ≥ 55% |
| Aha moment | % who create ≥1 reserveringspotje in week 1 | ≥ 40% |
| W4 retention | % of activated users opening in week 4 | ≥ 35% |
| Habit | Median opens per week among retained users | ≥ 3 |
| Categorisation quality | % of transactions auto-categorised correctly (user does not change it within 14 days) | ≥ 88% |
| Sync health | % of active bank connections successfully refreshed in last 24h | ≥ 95% |
| Free → Plus | Trial start → paid conversion | ≥ 25% |
| Support load | Tickets per 1000 MAU per month | ≤ 8 |

## 7. Explicit non-goals (v1–v2)

- Payment initiation (PIS). We read, we never move money.
- Investments, crypto, pension aggregation beyond manual net-worth entries.
- Financial *advice* in the AFM regulatory sense. We show facts and norms only.
- Business accounting / invoicing. ZZP support is a tagging + BTW-potje layer (v2), not bookkeeping.
- Web app. Mobile only until v3 (a read-only web export exists from v1.5).
- Non-EUR primary currency.

## 8. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Aggregator coverage/reliability for a Dutch bank breaks | High | Adapter interface (`docs/08` §3) so a provider can be swapped; CSV/MT940 import always available as fallback |
| PSD2 90-day consent re-auth kills retention | High | Proactive re-consent flow starting day 76, deep-link straight into the bank app, clear value reminder |
| AISP licensing burden | High | Operate under the aggregator's licence as a technical service provider; legal review gate before public launch (`docs/16` §7) |
| Users distrust connecting banks | Medium | Manual-first onboarding option; explicit "read-only, we cannot move money" copy; EU hosting badge |
| Categorisation feels wrong → churn | Medium | Seeded NL merchant dictionary + one-tap correction that creates a rule |
| Competing with free bank apps | Medium | Multi-bank + bucket model + calendar are things a single bank cannot do |
| iDEAL → Wero migration changes transaction descriptors | Medium | Parser handles both descriptor families; see `docs/09` §6 |

## 9. Name & brand

- **Name**: Kwartje. From *"het kwartje valt"* — the penny drops. Short, unmistakably Dutch, no trademark collision with a bank.
- **Tone**: nuchter (level-headed), helpful, dry humour allowed, never chirpy.
- **Mark**: a coin dropping into a slot; the "o" of a potje. See `docs/12` §1.
