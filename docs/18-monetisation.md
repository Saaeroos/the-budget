# 18 — Monetisation

## 1. Model

Freemium subscription. No ads, no data resale, no affiliate placements inside the product, no lead generation for insurers or lenders. Revenue comes from users only — this is a positioning asset in a privacy-sensitive market, and it should be stated on the paywall.

## 2. Tiers

| | **Gratis** | **Plus** | **Huishouden** |
|---|---|---|---|
| Price | € 0 | € 3,99 / mnd · € 34,99 / jr | € 5,99 / mnd · € 54,99 / jr |
| Bank connections | 1 | onbeperkt | onbeperkt |
| Transactions & categories | ✓ | ✓ | ✓ |
| Four-bucket budget | ✓ | ✓ | ✓ |
| Potjes | 2 | onbeperkt | onbeperkt |
| Veilig te besteden | ✓ | ✓ | ✓ |
| Forecast | 14 dagen | 90 dagen | 90 dagen |
| Abonnementenradar | zien | + prijsstijgingen, opzegdata | ✓ |
| Regels | 5 | onbeperkt | onbeperkt |
| Splits & Tikkie | ✓ | ✓ | ✓ |
| Export (CSV/XLSX/PDF) | JSON only (AVG) | ✓ | ✓ |
| Toeslagen-module | — | ✓ | ✓ |
| Jaarafrekening & eigen risico | — | ✓ | ✓ |
| Nibud-vergelijking | — | ✓ | ✓ |
| Extra huishoudleden | — | — | tot 5 |
| Persoonlijk/gedeeld splitsen | — | — | ✓ |

Yearly saving stated in euros on the paywall (`Je bespaart € 12,89 per jaar`), never as "save 27%!".

Trial: **14 days**, no card required where the store allows it, one per account. Withdrawal right honoured per EU consumer law.

## 3. Paywall placement

Shown when the user hits a real limit, never on launch and never blocking day-1 value:

| Trigger | Screen |
|---|---|
| Connecting a 2nd bank | `modals/paywall` with the banks context |
| Creating a 3rd potje | potjes context |
| Opening forecast beyond 14 days | forecast context |
| Inviting a household member | huishouden context (Huishouden tier) |
| Export to CSV/XLSX/PDF | export context |
| Opening the toeslagen module | toeslagen context |
| Creating a 6th rule | regels context |

Each context shows the specific benefit first, then the rest of the tier. One screen, one price block, one primary button, one "Niet nu".

**Forbidden**: countdown timers, "only today", pre-ticked upsells, hiding the close button, interstitials on app open, guilt copy, more than one paywall per session.

## 4. Implementation

- **RevenueCat** (`react-native-purchases`) for products, trials, receipts and cross-platform entitlement.
- Entitlements: `plus`, `household`. The client reads them for **UI gating only**.
- **Server-side enforcement is authoritative**: an `entitlements(user_id, tier, expires_at, source)` table written by the `subscription/sync` Edge Function after verifying with RevenueCat's API. Every gated Edge Function and RPC checks this table, not the client's claim.
- Restore purchases is always available in `instellingen/abonnement`.
- Grace period: keep `plus` features for 3 days after a billing failure, then downgrade with a clear in-app message. Data is never deleted on downgrade — extra potjes and connections become read-only, not gone.

## 5. Store products

| Store id | Type | Tier |
|---|---|---|
| `nl.kwartje.plus.monthly` | auto-renewing, 1 month | plus |
| `nl.kwartje.plus.yearly` | auto-renewing, 1 year | plus |
| `nl.kwartje.household.monthly` | auto-renewing, 1 month | household |
| `nl.kwartje.household.yearly` | auto-renewing, 1 year | household |

Prices set per-store in EUR with the Dutch storefront as the reference. All prices are shown **including BTW** (Dutch consumers expect gross prices).

## 6. Metrics

| Metric | Target |
|---|---|
| Paywall view → trial start | ≥ 12% |
| Trial → paid | ≥ 25% |
| Monthly churn (paid) | ≤ 4% |
| Yearly share of new subs | ≥ 45% |
| Refund rate | ≤ 2% |

Track as aggregate counts only. Never attach financial data to a monetisation event.

## 7. Things we will not do

- Sell or share transaction data, aggregated or otherwise, with third parties.
- Insurance, energy or mortgage referral commissions inside the app. (This is where competitors monetise; refusing it is part of the brand and removes an AFM advice risk.)
- Charge for data export (AVG art. 20 must remain free — JSON export is free in every tier).
- Lock a user out of their own historical data on downgrade.
