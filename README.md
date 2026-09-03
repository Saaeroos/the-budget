# Kwartje — Dutch-first budgeting app

> *"Het kwartje valt"* — the moment your money finally makes sense.

A mobile budgeting app for the **Dutch market**, built with **React Native + Expo**, backed by **Supabase**, with **PSD2 bank sync** via a licensed aggregator.

This repository currently contains **the complete build specification**. It is written so that an AI coding assistant (Claude Code, Cursor, Codex, etc.) can implement the entire application from these documents without further product input.

---

## How to use this repo

1. **Read `CLAUDE.md` first.** It is the operating manual for the AI coder: stack rules, conventions, guardrails, definition of done.
2. **Read `docs/00-INDEX.md`.** It maps every document and tells you the reading order per task type.
3. **Work from `docs/22-task-backlog.md`.** It contains ordered, atomic, testable tickets (`KW-001` …). Each ticket names the spec sections it implements.
4. Never invent product behaviour. If a spec is ambiguous, follow the *Ambiguity protocol* in `CLAUDE.md`.

---

## Documentation map

| # | File | What it answers |
|---|------|-----------------|
| 00 | [Index](docs/00-INDEX.md) | Where is everything |
| 01 | [Product brief](docs/01-product-brief.md) | What are we building and why |
| 02 | [Dutch market](docs/02-market-nl.md) | Why NL is different — the research |
| 03 | [Personas & jobs](docs/03-personas-jobs.md) | Who we build for |
| 04 | [Feature catalogue](docs/04-features.md) | Everything, prioritised MVP → v3 |
| 05 | [Information architecture](docs/05-information-architecture.md) | Navigation, screen inventory, routes |
| 06 | [Data model](docs/06-data-model.md) | Entities, relations, invariants |
| 07 | [Supabase schema](docs/07-supabase-schema.md) | DDL, RLS, functions, migrations |
| 08 | [Bank sync (PSD2)](docs/08-bank-sync-psd2.md) | Aggregator, consent, sync engine |
| 09 | [Categorisation engine](docs/09-categorisation-engine.md) | Rules, NL merchant dictionary, learning |
| 10 | [Budget engine](docs/10-budget-engine.md) | The Nibud 4-bucket math, rollover, forecast |
| 11 | [Screen specs](docs/11-screens-spec.md) | Every screen, state by state |
| 12 | [Design system](docs/12-design-system.md) | Tokens, type, components, motion |
| 13 | [Frontend architecture](docs/13-frontend-architecture.md) | Expo setup, folders, state, conventions |
| 14 | [API contracts](docs/14-api-contracts.md) | Edge functions, typed client, errors |
| 15 | [Dutch localisation](docs/15-i18n-nl.md) | Copy, tone, formats, full NL string table |
| 16 | [Security, privacy, AVG](docs/16-security-privacy-avg.md) | GDPR, encryption, licensing, DPIA |
| 17 | [Notifications & automation](docs/17-notifications-automation.md) | Push, jobs, widgets |
| 18 | [Monetisation](docs/18-monetisation.md) | Tiers, paywall, RevenueCat |
| 19 | [Testing & QA](docs/19-testing-qa.md) | Unit, RLS, E2E, fixtures |
| 20 | [Release & ops](docs/20-release-ops.md) | EAS, OTA, store listings, monitoring |
| 21 | [Roadmap](docs/21-roadmap.md) | Milestones and gates |
| 22 | [Task backlog](docs/22-task-backlog.md) | The tickets to implement |
| 23 | [AI designer prompt](docs/23-ai-designer-prompt.md) | Copy-paste brief for a design agent |
| 24 | [Local development](docs/24-local-dev.md) | Setup, dev auth bypass, fixtures, scripts |
| — | [Decisions](docs/DECISIONS.md) | Every deviation, with its reason |

### Engineering rules — `.claude/`

| Path | What it is |
|---|---|
| [`.claude/rules/`](.claude/rules/) | Binding rules: architecture, TEXT objects & types, 400-line limit, SOLID, TanStack Query + Zustand, UI, testing, security, git, review checklist |
| [`.claude/commands/`](.claude/commands/) | `/new-feature`, `/new-screen`, `/new-migration`, `/review`, `/check` |
| [`.claude/agents/`](.claude/agents/) | `code-reviewer`, `spec-checker`, `ui-implementer` |
| [`.claude/settings.json`](.claude/settings.json) | Permissions and hooks that enforce the rules mechanically |

---

## Stack at a glance

- **App**: Expo SDK 55 (RN 0.83, React 19.2, New Architecture), Expo Router v7, TypeScript strict
- **Local store**: expo-sqlite + Drizzle ORM (offline-first read cache)
- **Server**: Supabase (Postgres + RLS + Auth + Edge Functions + pg_cron), EU region (`eu-central-1`, Frankfurt)
- **Bank data**: Enable Banking (AIS) via Edge Functions — never called from the device
- **Payments**: RevenueCat → App Store / Google Play
- **Language**: Dutch first (`nl-NL`), English second

## Non-negotiables

1. Dutch first. Every string ships in `nl-NL` before English.
2. No financial data leaves the EU. Ever.
3. Bank credentials and aggregator keys never touch the device.
4. The budget model is **Nibud's four buckets**, not American envelopes.
5. No ads, no data resale, no dark patterns.
6. No file over 400 lines. No hardcoded strings — `TEXT` object and types at the top of every file.
7. TanStack Query owns server state, Zustand owns UI state, and never the reverse.
8. `pnpm dev` starts with no login screen and real fixture data.
