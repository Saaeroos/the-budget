# 19 — Testing & QA

## 1. Test pyramid & coverage gates

| Layer | Tool | Scope | Gate |
|---|---|---|---|
| Pure logic | Jest (`jest-expo`) | `packages/shared/**`, `features/*/logic/**` | **100% branch** — CI fails below |
| Components | `@testing-library/react-native` | `src/ui/**`, key feature components | ≥ 70% lines |
| Database | pgTAP | RLS, constraints, triggers, RPCs | every tenant table covered |
| Edge functions | Deno test + `MockAggregatorAdapter` | contracts, sync, enrich, import | ≥ 80% lines |
| E2E | Maestro | 8 critical flows (§5) | all green on iOS + Android |
| Visual | Maestro screenshots + manual review | key screens, light/dark, 100%/200% type | reviewed per release |
| Performance | Maestro trace + custom marks | startup, list scroll, sync | budgets in §6 |

No mocking of the module under test. No snapshot tests of business output — assert values, not serialised trees.

## 2. What must be tested, non-negotiably

Every invariant in `docs/06` §11, every case in the `docs/10` §11 matrix, and:
- money formatting (`docs/15` §1)
- description normalisation (`docs/09` §2 worked examples)
- every CSV/MT940 parser against a real fixture
- Sentry scrubbing (`docs/16` §3)
- RLS cross-tenant isolation on every table
- offline outbox: write offline → kill app → relaunch → reconnect → change lands exactly once

## 3. Fixtures

`packages/shared/__fixtures__/` — deterministic, committed, no random generation in tests.

| Fixture | Contents |
|---|---|
| `household-sanne.json` | P1: 1 ING account, monthly income on the 24th, 6 months of transactions, 3 series, 2 potjes |
| `household-bram-fleur.json` | P2: Rabobank joint + 2 personal, kinderopvangtoeslag, gemeentebelasting instalments, jaarafrekening, income shares 60/40 |
| `household-youssef.json` | P3: irregular ZZP income, business/private mix, BTW quarters |
| `transactions-labelled.json` | **500** realistic Dutch transactions with expected category keys (accuracy gate, `docs/09` §9) |
| `descriptors.json` | 120 raw bank descriptor strings → expected `description_clean` + `counterparty_name` |
| `bank-ing.csv`, `bank-rabobank.csv`, `bank-abnamro.csv`, `bank-bunq.csv`, `bank-sns.csv`, `sample.mt940`, `sample.camt053.xml` | Import parser fixtures |
| `aggregator-*.json` | Provider payloads for the mock adapter, incl. pending→booked transitions, a 429, a consent-expired error |

Fixture data must be **synthetic** — never a real person's bank export, even the developer's own, in the repo.

## 4. Import parser tests

For each parser: header detection, negative/positive amount conventions (ING uses an `Af/Bij` column; Rabobank uses signed amounts; ABN uses a separate debit/credit indicator), decimal comma, date format, encoding (Windows-1252 vs UTF-8), quoted fields containing semicolons, and an empty file. Round-trip test: parse → normalise → dedupe → re-import the same file → 0 new rows.

## 5. E2E flows (Maestro)

1. **Onboarding, manual path** — signup → household → skip bank → add 3 transactions → create a potje → Vandaag shows a number.
2. **Onboarding, bank path** — signup → pick ING (mock) → consent → initial sync → confirm fixed costs → first potje.
3. **Categorise & learn** — open review queue → recategorise → accept "altijd zo doen" → verify a later transaction is auto-categorised.
4. **Split a Tikkie** — mark a transaction as shared → 3 people → verify own share in budget → mark one as paid.
5. **Potje lifecycle** — create → contribute → fall behind → adjust → complete → recycle.
6. **Consent expiry** — force expiry → banner appears → reconnect → history preserved, user edits preserved.
7. **Offline** — enable airplane mode → add + edit transactions → relaunch → reconnect → verify exactly-once sync.
8. **Paywall** — hit the 3rd potje limit → paywall → close → verify no data loss; then mock purchase → verify server entitlement gates the feature.

## 6. Performance budgets

| Metric | Budget | Measured |
|---|---|---|
| Cold start to interactive (10k local txns) | < 1.5 s | Maestro trace, iPhone 12 / Pixel 6a |
| Vandaag first paint after warm start | < 400 ms | custom mark |
| Transaction list scroll | ≥ 58 fps, no blank cells | manual + Reanimated frame log |
| Search keystroke → results | < 120 ms over 10k rows | FTS5 benchmark test |
| Initial sync, 2000 transactions | < 45 s end to end | integration test |
| Enrich 1000 transactions | < 3 s | Deno bench |
| Bundle size (JS, gzipped) | < 3.5 MB | `expo-atlas` in CI |

A PR that regresses any budget by >10% fails CI.

## 7. Manual QA matrix (per release)

| Axis | Values |
|---|---|
| Device | iPhone SE (small), iPhone 15, Pixel 6a, Samsung A54 |
| OS | iOS 17 + latest, Android 12 + latest |
| Theme | light, dark |
| Font scale | 100%, 200% |
| Locale | nl-NL, en-GB |
| Network | online, offline, slow 3G, flaky (toggle mid-sync) |
| Data volume | empty account, 100 txns, 10.000 txns |
| Bank state | active, expiring, expired, error |

## 8. Accessibility audit

Per release, on two screens minimum plus every new screen: VoiceOver and TalkBack full pass, 200% type, contrast checker on both themes, reduce-motion enabled, external keyboard focus order.

## 9. Release gates

A build may not go to production if any of these is red:
- CI: typecheck, lint, unit, pgTAP, edge tests, categorisation accuracy ≥88%, performance budgets
- All 8 E2E flows green on both platforms
- Manual QA matrix signed off
- Accessibility audit signed off
- Security checklist (`docs/16` §10) signed off
- Crash-free sessions ≥ 99.5% on the previous release
