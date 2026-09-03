# 22 — Task backlog

Ordered, atomic tickets. Work top to bottom. Tick the box when the ticket meets the **Definition of Done** in `CLAUDE.md` §5. Each ticket names the spec sections it implements — read those before starting.

Branch: `feat/KW-0xx-slug`. Commit: Conventional Commits.

---

## M0 — Foundation

- [ ] **KW-001** Monorepo scaffold: pnpm workspaces, `apps/mobile`, `packages/shared`, `supabase/`, tsconfig base, ESLint flat config, Prettier, knip. → `13 §1`, `.claude/rules/*`
- [ ] **KW-002** Expo app bootstrap with SDK 55, New Architecture, expo-router typed routes, `app.json` per `13 §1`. Blank Vandaag route renders.
- [ ] **KW-003** Design tokens + `ThemeProvider` (light/dark/system) + `Text`, `Money`, `Button`, `Card` primitives. → `12 §2–§5`
- [ ] **KW-004** i18n setup: i18next, `nl.json`/`en.json` skeleton, `formatEUR`, `formatDateNL`, `formatMoneyForSpeech`, lint rule banning literal strings in TSX. → `15`, `.claude/rules/text-and-types.md`
- [ ] **KW-005** Supabase project + migrations 0001 (enums, households, profiles, members) with RLS + pgTAP. → `07 §1–§4`
- [ ] **KW-006** Auth: email OTP + Apple + Google, `AuthProvider`, secure-store session, `AppLockGate`. → `16 §4`, `11 §1.2`
- [ ] **KW-007** **Local dev auth bypass** + fixture seeding (`EXPO_PUBLIC_SKIP_AUTH`). → `24-local-dev.md`
- [ ] **KW-008** SQLite + Drizzle mirror, `DatabaseProvider`, migrations on start, FTS5 index. → `13 §5`
- [ ] **KW-009** react-query setup with MMKV persistence, key factories, repository pattern. → `13 §3–§4`
- [ ] **KW-010** Outbox + `SyncProvider`: optimistic writes, flush, retry, conflict resolution. → `13 §6`, `06 §10`
- [ ] **KW-011** CI: typecheck, lint, unit, pgTAP, secrets scan, bundle size. → `20 §3`
- [ ] **KW-012** Error model: `AppError`, error boundaries, `useErrorToast`, Sentry with scrubber + its unit test. → `13 §8`, `16 §3`

## M1 — Manual money

- [ ] **KW-013** Migration: categories + seed all system categories per `06 §6`. Bucket derived from the category group, never set directly (I-9). Category icons map. → `12 §7`
- [ ] **KW-014** Migration: transactions, splits, indexes, constraints, triggers (I-1, I-4, I-6), RLS + pgTAP. → `07 §3–§5`
- [ ] **KW-015** Transaction repository + `useTransactions` with keyset pagination and local-first reads. → `13 §4`, `14 §3`
- [ ] **KW-016** Transactions screen: FlashList, day grouping, sticky headers, pending styling, empty/loading/error states. → `11 §3`
- [ ] **KW-017** Search + filters + filter chips + FTS5 query path. → `11 §3`
- [ ] **KW-018** Snel toevoegen modal: `AmountInput`, direction, category picker, ≤3 taps. → `11 §11`
- [ ] **KW-019** Transaction detail: edit, scope, tags, note, exclude, delete, locked bank fields. → `11 §3.4`
- [ ] **KW-020** Splits UI + `transaction_splits` math (I-7). → `11 §3.4`, `10 §2`
- [ ] **KW-021** Period engine (`periodFor`, all three kinds) + `budget_periods` migration with the exclusion constraint (I-10). → `10 §1`, `07 §3`
- [ ] **KW-022** Budget lines migration + `v_period_actuals` view + `rpc_current_period`. → `07 §3, §6`
- [ ] **KW-023** Budget engine pure functions: planned/actual/available/over per line and per bucket. 100% branch coverage. → `10 §2–§3`
- [ ] **KW-024** Budget bewerken screen with sticky totals and the history-fill action. → `11 §6`
- [ ] **KW-025** Overzicht: bucket donut, in/uit, top categories, period switcher. → `11 §5`, `12 §6`
- [ ] **KW-026** Categorie detail with 12-month sparkline. → `11 §5.3`

## M2 — Potjes & the number

- [ ] **KW-027** Envelopes + contributions migration, `saved_cents` trigger (I-11), RLS + pgTAP. → `07 §3, §5`
- [ ] **KW-028** Envelope math: `monthlyContribution`, `expectedByNow`, behind/ahead, `recycle`. → `10 §4`
- [ ] **KW-029** Potjes list + detail + create modal with the live "dat is € x per maand" preview. → `11 §4`
- [ ] **KW-030** Rollover: modes, `carryInto`, `rpc_roll_period` (idempotent) + tests. → `10 §3.4`
- [ ] **KW-031** `safeToSpend` pure function + `rpc_safe_to_spend` + the full test matrix. → `10 §5`
- [ ] **KW-032** Vandaag screen: hero card, explainer sheet, komt eraan, te controleren, achterstand, recent. → `11 §2`
- [ ] **KW-033** Forecast v1 (14 days) + low-balance day detection + chart. → `10 §6`

## M3 — Bank sync

- [ ] **KW-034** Aggregator adapter interface + `MockAggregatorAdapter` + fixtures (ING, Rabobank, bunq, 400+ transactions). → `08 §3, §11`
- [ ] **KW-035** Enable Banking adapter implementation behind the interface. → `08 §1, §3`
- [ ] **KW-036** Migrations: `bank_connections`, `bank_accounts`, `balances`, `sync_jobs`, `bank_auth_nonces`. IBAN hashing with Vault pepper (I-3); no credentials or provider tokens persisted (I-2). → `06 §4`, `16 §3`
- [ ] **KW-037** Edge functions `bank/institutions`, `bank/connect`, `bank/callback` with signed single-use `state`. → `14 §2`, `08 §5`
- [ ] **KW-038** Connect flow UI: bank picker, per-bank notices, explainer, `openAuthSessionAsync`, real-count progress. → `11 §1.4`
- [ ] **KW-039** Sync engine: windowing, pagination, job queue, budgets, backoff. → `08 §6`
- [ ] **KW-040** Normalisation + dedupe + pending reconciliation + transfer pairing (I-5, I-8). → `08 §7`
- [ ] **KW-041** Consent lifecycle: states, banners, renew preserving history and user edits. → `08 §8`, `11 §7`
- [ ] **KW-042** Rekeningen + koppeling screens, include-in-budget toggles, sync history. → `11 §7`
- [ ] **KW-043** Realtime + polling for sync completion. → `14 §4`

## M4 — Intelligence

- [ ] **KW-044** Description normaliser with all worked examples as tests. → `09 §2`
- [ ] **KW-045** Merchant seed (250 NL merchants) + local logo assets + matcher. → `09 §6`
- [ ] **KW-046** Rules engine: schema, operators, compiled evaluation, timeout guard. → `09 §3`
- [ ] **KW-047** Categorisation pipeline stages 0–8 + confidence + review queue flagging. → `09 §1`
- [ ] **KW-048** Labelled fixture set (500 transactions) + the ≥88% CI accuracy gate. → `09 §9`
- [ ] **KW-049** Learning from corrections + "altijd zo doen" + retro-apply prompt. → `09 §4`
- [ ] **KW-050** Rules editor screen with test-run against history. → `11 §10`
- [ ] **KW-051** Recurring series detection + occurrences + missed/price-up signals. → `09 §7`
- [ ] **KW-052** Abonnementenradar screen incl. Wet Van Dam hedged copy. → `11 §8`, `15 §3`
- [ ] **KW-053** Review mode (card stack) for the te-controleren queue. → `11 §3`

## M5 — Dutch layer

- [ ] **KW-054** Tikkie/Wero/iDEAL descriptor handling + split participants + settle-up share sheet. → `09 §5.4`, `11 §9`
- [ ] **KW-055** Statiegeld netting rule. → `09 §5.4`
- [ ] **KW-056** Notifications: catalogue, `queue_notifications`, `dispatch-notifications`, settings screen, quiet hours, caps. → `17 §2–§3`
- [ ] **KW-057** Widgets (veilig te besteden, potje) + quick-add shortcut. → `17 §6`
- [ ] **KW-058** Full nl copy pass against the copy checklist; en-GB translation. → `15 §7`
- [ ] **KW-059** Accessibility pass on every screen + speech formatters. → `12 §10`, `15 §5`
- [ ] **KW-060** All 8 Maestro E2E flows. → `19 §5`

## M6 — Beta & monetisation

- [ ] **KW-061** RevenueCat integration + `entitlements` table + `subscription/sync` + server-side gating. → `18 §4`
- [ ] **KW-062** Paywall modal + contextual triggers + limit enforcement. → `11 §12`, `18 §3`
- [ ] **KW-063** Export edge function (CSV/XLSX/JSON) + privacy screen + account deletion. → `14 §2`, `16 §6`
- [ ] **KW-064** Household invites, members, income shares, `splitByIncome` with largest-remainder. → `10 §7`, `11 §10`
- [ ] **KW-065** Performance pass against the budgets in `19 §6`.
- [ ] **KW-066** DPIA, processor register, privacy policy, terms. → `16 §6, §9`

## M7 — Launch

- [ ] **KW-067** Store listings (nl first), screenshots, privacy labels, reviewer demo account. → `20 §4`
- [ ] **KW-068** Monitoring dashboards, status page, alerting. → `20 §5`
- [ ] **KW-069** Runbook + incident drill (OTA rollback, institution disable, pause cron). → `20 §7`
- [ ] **KW-070** Launch checklist. → `20 §8`

---

## Parallelisation

Safe to run in parallel once M0 is done:
- KW-013…020 (transactions) ∥ KW-021…024 (budget) — they meet at KW-025.
- KW-034…035 (adapter) ∥ KW-036…037 (schema + functions).
- KW-044…048 (categorisation, pure) ∥ anything UI.
- KW-058…059 (copy + a11y) ∥ KW-061…062 (monetisation).

Never parallelise: anything touching the same migration file, or two tickets both editing `nl.json` sections of the same feature.
