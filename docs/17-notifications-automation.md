# 17 — Notifications, background jobs & widgets

## 1. Principles

- Every notification must be **actionable** and **earned**. If a user could not do anything about it, it is not a notification.
- Hard cap: **4 pushes per week**, and never more than 1 per day, except a true low-balance warning which may add one.
- Quiet hours default 22:00–08:00 `Europe/Amsterdam`; nothing sends during them.
- Every type is individually toggleable, with sensible defaults, in `instellingen/meldingen`.
- The lock screen never shows an amount or merchant (`docs/16` §2).

## 2. Notification catalogue

| Key | Trigger | Default | Priority | Body (nl) |
|---|---|---|---|---|
| `payday` | Income event matched today | on | normal | `Je salaris is binnen. Bekijk wat er deze periode veilig te besteden is.` |
| `low_balance_forecast` | Forecast crosses below buffer within 10 days, first detection only | on | high | `Rond {{date}} kom je onder je buffer. Bekijk wat je kunt verschuiven.` |
| `big_bill_soon` | Obligation or series ≥ €150 due in 5 days | on | normal | `Over 5 dagen wordt {{name}} afgeschreven.` |
| `consent_expiring` | 14 / 7 / 2 days before `expires_at` | on | high | `De koppeling met {{bank}} verloopt binnenkort. Vernieuw hem in de app.` |
| `consent_expired` | On expiry | on | high | `De koppeling met {{bank}} is verlopen. Je transacties worden niet meer bijgewerkt.` |
| `sync_failed` | 3 consecutive failures | on | normal | `We konden {{bank}} niet bereiken. We blijven het proberen.` |
| `envelope_behind` | A potje is >15% behind and the period is >50% elapsed | on | normal | `{{name}} loopt achter. Bekijk je potje.` |
| `subscription_price_up` | Matched occurrence >8% above trailing median | on | normal | `{{merchant}} is duurder geworden.` |
| `subscription_missed` | Expected occurrence +5 days, unmatched | off | low | `{{merchant}} is deze maand niet afgeschreven.` |
| `unusual_charge` | Single expense >3× the 90-day median for that category, or a new merchant >€200 | on | normal | `Ongebruikelijke uitgave gezien. Klopt dit?` |
| `review_backlog` | ≥15 uncategorised transactions, max once per week | on | low | `{{count}} transacties wachten op een categorie.` |
| `weekly_digest` | Monday 09:00 | on | low | `Je week in het kort.` |
| `period_rolled` | New budget period started | off | low | `Nieuwe periode begonnen: {{label}}.` |
| `benefit_review` | Income change detected while a benefit is active | on | high | `Je inkomen is gewijzigd. Geef dit door aan de Belastingdienst.` |
| `annual_zorg_switch` | 15 November | on | normal | `Je kunt je zorgverzekering tot 31 december opzeggen.` |
| `vakantiegeld_planner` | 20 April | on | normal | `Je vakantiegeld komt eraan. Waar gaat het naartoe?` |
| `year_start` | 2 January | on | low | `Nieuw jaar: eigen risico is opnieuw begonnen.` |

Deep link: every notification carries `data.route` pointing at the exact screen (e.g. `kwartje://potjes/<id>`).

## 3. Delivery pipeline

```
pg_cron 05:30 UTC → queue_notifications()
  for each household:
    candidates = evaluateRules(household, today)
    apply per-user toggles
    apply quiet hours (household timezone, always Europe/Amsterdam in v1)
    apply frequency caps (≤1/day, ≤4/week, per-type cooldowns)
    rank by priority, keep the top 1 (2 if one is `high` low_balance)
    insert into notifications(scheduled_for)

Edge Function `dispatch-notifications` (invoked by cron every 15 min):
  select due, unsent notifications
  group by expo push token
  POST to Expo push API in chunks of 100
  record sent_at, handle DeviceNotRegistered → delete token
```

Per-type cooldowns: `low_balance_forecast` 7 days · `envelope_behind` 14 days per envelope · `unusual_charge` 3 days · `review_backlog` 7 days · `sync_failed` 3 days per connection.

## 4. Background jobs (recap of `docs/07` §7)

| Job | Cadence | Idempotent? | Notes |
|---|---|---|---|
| `sync_all_connections` | daily 04:00 UTC | yes | jittered per household |
| `detect_recurring` | daily 05:00 | yes | only households with new transactions |
| `refresh_forecasts` | daily 05:15 | yes | materialised into `forecast_cache` |
| `queue_notifications` | daily 05:30 | yes | see §3 |
| `dispatch_notifications` | every 15 min | yes | |
| `roll_periods` | daily 06:00 | yes | households whose period ends today |
| `expire_consents` | hourly | yes | state transitions only |
| `cleanup` | daily 02:00 | yes | stale pending txns, expired export URLs, old nonces |
| `annual_reset` | 1 Jan 03:00 | yes | eigen risico reset, box 3 snapshot |

Every job writes a row to `job_runs(name, started_at, finished_at, ok, stats jsonb, error)`. A job that fails 3 times in a row raises a Sentry alert.

## 5. Client-side scheduling

Only two things are scheduled locally (so they work without a server round-trip):
- The app-lock timer.
- A local reminder the user sets manually on an obligation ("herinner me 3 dagen van tevoren").

Everything else is server-driven so it stays consistent across devices.

## 6. Widgets (F-57)

Built with `expo-widgets` (alpha in SDK 55 — if it is not production-ready at implementation time, record a decision and defer to a native module).

| Widget | Size | Content |
|---|---|---|
| Veilig te besteden | small | Big number + `nog 11 dagen` |
| Veilig te besteden + komt eraan | medium | Number + next 2 upcoming items |
| Potje | small | Ring + name + remaining |

Refresh: on app foreground, after a sync, and at most every 30 minutes via the OS budget. Data is written to a shared App Group / SharedPreferences by the app; the widget never performs a network call, so it never needs credentials.

Quick add (F-58): an iOS App Shortcut and an Android app shortcut that deep-links to `kwartje://modals/snel-toevoegen`.

## 7. Automation the app performs silently

These need no notification and no confirmation:
- Auto-categorisation at confidence ≥0.70.
- Series detection at confidence ≥0.80.
- Transfer pairing.
- Pending → booked merging.
- Period rolling and rollover.
- Envelope contribution accrual (bookkeeping only — never an actual money movement).

These always need confirmation:
- Creating a learned rule from corrections (offered, not imposed).
- Retro-applying a rule to history.
- Anything that changes a planned amount the user set.
- Anything that would send a message to another person.
