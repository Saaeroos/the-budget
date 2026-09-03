# 20 — Release & operations

## 1. Environments

| Env | Supabase project | EAS profile | Bundle id | Aggregator |
|---|---|---|---|---|
| development | local (`supabase start`) | `development` | `nl.kwartje.app.dev` | mock adapter |
| preview | `kwartje-staging` (eu-central-1) | `preview` | `nl.kwartje.app.preview` | Enable Banking sandbox / restricted production |
| production | `kwartje-prod` (eu-central-1) | `production` | `nl.kwartje.app` | Enable Banking production |

Never point a development or preview build at the production Supabase project. A CI check asserts the URL matches the profile.

## 2. EAS

`eas.json`
```jsonc
{
  "cli": { "version": ">= 12.0.0", "appVersionSource": "remote" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal",
                     "env": { "EXPO_PUBLIC_ENV": "development", "EXPO_PUBLIC_SKIP_AUTH": "1" } },
    "preview":     { "distribution": "internal", "channel": "preview",
                     "env": { "EXPO_PUBLIC_ENV": "preview" } },
    "production":  { "channel": "production", "autoIncrement": true,
                     "env": { "EXPO_PUBLIC_ENV": "production" } }
  },
  "submit": { "production": {} }
}
```

- **Runtime version**: `policy: "fingerprint"` so OTA updates only reach compatible binaries.
- **OTA (`eas update`)**: allowed for JS-only fixes, copy and styling. **Never** for anything touching the database schema, the sync engine's persistence format, or entitlement logic — those ship as a store build.
- Rollback: `eas update:rollback` to the previous published update on the channel. Practise it once before launch.

## 3. CI/CD (GitHub Actions)

| Workflow | Trigger | Steps |
|---|---|---|
| `ci.yml` | every PR | install → typecheck → lint → knip → unit → pgTAP (supabase local) → edge tests → categorisation accuracy gate → bundle size |
| `e2e.yml` | PR to `main`, nightly | EAS build (development) → Maestro cloud on iOS + Android |
| `preview.yml` | merge to `main` | `supabase db push` to staging → deploy edge functions → `eas update --channel preview` |
| `release.yml` | tag `v*` | migrate prod → deploy functions → `eas build --profile production` → `eas submit` |
| `secrets-scan.yml` | every PR | gitleaks + the `EXPO_PUBLIC_` secret-shape check |

Database migrations run **before** the app build that needs them, and must be backward compatible with the currently released app (expand → migrate → contract, across two releases).

## 4. Store presence

**App Store / Play, NL storefront first.**
- Name: `Kwartje — huishoudboekje`
- Subtitle: `Overzicht, potjes en vaste lasten`
- Keywords: huishoudboekje, budget, vaste lasten, potjes, sparen, uitgaven, overzicht, geld, banken, PSD2, toeslagen
- Screenshots (nl): Vandaag met veilig te besteden · Potjes · Abonnementen · Overzicht met de vier bakjes · Bank koppelen met de "alleen-lezen" belofte
- Privacy nutrition labels must match `docs/16` exactly. Declare: financial info (linked, app functionality), contact info (linked), identifiers (linked), usage data (not linked). Declare **no** tracking.
- App Store requires a demo account for review that reaches full functionality **without** a real bank: ship a reviewer account seeded with `household-sanne.json` fixture data and a mock connection.
- Age rating 4+ / PEGI 3, but terms set a 16 minimum.

## 5. Monitoring

| Signal | Tool | Alert |
|---|---|---|
| Crashes | Sentry (EU) | crash-free sessions < 99.5% |
| Edge function errors | Sentry + Supabase logs | error rate > 2% over 15 min |
| Sync health | `job_runs` + a Grafana/Metabase view on Postgres | < 95% connections refreshed in 24h |
| Aggregator availability | synthetic check every 15 min per major NL bank | 2 consecutive failures for one bank |
| Consent expiries | daily count | spike > 2× baseline |
| Categorisation accuracy | weekly job over corrections | < 85% |
| Push delivery | Expo receipts | > 5% failures |
| Store reviews | manual weekly | rating < 4.3 |

Status page (`status.kwartje.nl`) listing per-bank connectivity — Dutch users will ask "is het ING of jullie?" and answering it publicly saves support load.

## 6. Support

- In-app: `instellingen/over` → contact form that attaches the last 20 `job_runs` rows for the user's household (no transaction content) plus app version and device.
- Response target: 1 working day.
- A public FAQ in Dutch covering: waarom moet ik elke 90 dagen opnieuw koppelen · waarom zie ik mijn creditcard niet · hoe verwijder ik mijn gegevens · waar staan mijn gegevens · Kwartje kan toch geen geld overmaken?

## 7. Incident response

| Severity | Definition | Response |
|---|---|---|
| SEV1 | Data exposure, wrong data shown across users, auth broken | Page immediately, freeze releases, AP breach assessment within 24h, notify within 72h if personal data is involved |
| SEV2 | Sync broken for a major bank, app crash loop, payments broken | Fix within 24h, status page update |
| SEV3 | Single feature broken, degraded UX | Next release |

Runbook lives in `docs/ops/runbook.md` and must contain: how to disable a bank institution, how to pause all cron jobs, how to roll back an OTA update, how to revoke all aggregator sessions, and the AP (Autoriteit Persoonsgegevens) notification contact path.

## 8. Launch checklist

- [ ] Legal: AISP arrangement confirmed in writing (`docs/16` §7)
- [ ] DPIA completed and signed off
- [ ] DPAs signed with every processor
- [ ] Privacy policy + terms live in Dutch and English
- [ ] All release gates in `docs/19` §9 green
- [ ] Reviewer demo account working without a real bank
- [ ] Status page live
- [ ] Support inbox monitored
- [ ] Rollback rehearsed
- [ ] Nibud data question resolved (permission or internal benchmark, `docs/16` §8)
