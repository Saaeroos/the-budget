# 04 — Feature catalogue

Every feature has a stable ID (`F-nn`). Priority: **M** = MVP (v1.0), **1** = v1.x, **2** = v2, **3** = later/exploratory.
"NL" marks features that only make sense in the Dutch market — these are the moat.

---

## A. Foundation

| ID | Feature | Pri | Description | Notes |
|---|---|---|---|---|
| F-01 | Account & auth | M | Email OTP (magic code), Sign in with Apple, Google. No passwords. | `docs/07` §Auth |
| F-02 | App lock | M | Biometric / device passcode lock on cold start and after 5 min background. | `expo-local-authentication` |
| F-03 | Onboarding | M | 4 steps: welcome → household setup → connect bank *or* start manual → first potje. Skippable, resumable. | `docs/11` §1 |
| F-04 | Household | M | 1..n members. Every object has a `scope`: `personal` or `household`. Invite by link + code. | `docs/06` §3 |
| F-05 | Manual transactions | M | Add/edit/delete income, expense, transfer. Amount pad opens first, keyboard-first flow. | |
| F-06 | Offline-first | M | Full read + write offline; queued mutations sync on reconnect with conflict resolution. | `docs/13` §6 |
| F-07 | Import CSV / MT940 / CAMT.053 | 1 | Named parsers for ING, Rabobank, ABN AMRO, bunq, SNS CSV exports + generic MT940/CAMT.053. Column mapper UI for unknown formats. | NL |
| F-08 | Export | 1 | CSV, XLSX, and a Nibud-style PDF overzicht. Full JSON data export (AVG art. 20). | NL |

## B. Bank connectivity

| ID | Feature | Pri | Description | Notes |
|---|---|---|---|---|
| F-09 | PSD2 bank sync | M | Connect ING, Rabobank, ABN AMRO, SNS/ASN/RegioBank, bunq, Triodos, Knab, Revolut, N26 via aggregator. Redirect SCA with app-switch. | NL, `docs/08` |
| F-10 | Consent lifecycle | M | Track 90-day expiry; nudge at T-14/T-7/T-2; one-tap renew; graceful "laatst bijgewerkt" degradation. | NL |
| F-11 | Multi-account model | M | Betaalrekening, spaarrekening, en/of-rekening, creditcard (where available), bunq sub-accounts. Per-account include/exclude from budget. | NL |
| F-12 | Balance & net worth | 1 | Daily balance snapshots per account; net worth over time incl. manually entered assets (auto, huis, beleggingen, pensioen). | |

## C. Dutch money engine — the moat

| ID | Feature | Pri | Description | Notes |
|---|---|---|---|---|
| F-13 | **Toeslagen module** | 1 | Track zorgtoeslag, huurtoeslag, kindgebonden budget, kinderopvangtoeslag as expected monthly income around the 20th. Detect actual receipts. Flag mismatch. Warn on income change: "je toeslag kan worden teruggevorderd — geef je wijziging door". Never advise amounts; link to Belastingdienst. | NL |
| F-14 | **Vakantiegeld & 13e maand planner** | 1 | Predict May payout from gross salary (8%) or manual amount. Pre-allocate the windfall to potjes before it lands. Same flow for a 13e maand. | NL |
| F-15 | **Jaarafrekening tracker (energie/water)** | 1 | Store termijnbedrag, contract start, optional meter readings. Estimate settlement (bijbetalen vs terugkrijgen) and its month. Suggest adjusting the termijnbedrag. | NL |
| F-16 | **Eigen risico tracker** | 1 | Yearly deductible (default €385, editable incl. vrijwillig verhoogd). Track consumed vs remaining; expect delayed declarations; reset on 1 January. Reminder in Nov/Dec about the switching window (opzeggen vóór 31 dec, kiezen vóór 31 jan). | NL |
| F-17 | **Abonnementenradar** | M | Detect recurring charges; show monthly/annual cost, next charge, price increases. Surface *Wet Van Dam* cancellability ("maandelijks opzegbaar vanaf …"). Deep link to the provider's cancel page. No cancellation-on-your-behalf. | NL |
| F-18 | **Gemeente- & waterschapsbelasting** | 1 | Template obligation for Feb/Mar; supports 8–10 instalment incasso; hint about **kwijtschelding** if income is low (informational, links to gemeente). | NL |
| F-19 | **Autokosten** | 2 | MRB quarterly, verzekering, APK date reminder, onderhoud potje, brandstof/laadkosten per maand, cost-per-km. | NL |
| F-20 | **Studieschuld / DUO** | 2 | Manual DUO loan: restschuld, maandtermijn, aflosfase start. Show as obligation, not advice. | NL |
| F-21 | **Tikkie / Wero / split** | M | Recognise Tikkie, betaalverzoek, iDEAL and Wero descriptors. Mark a transaction as "voorgeschoten" → create a split with N people → track who paid you back → settle-up link (Tikkie/Wero/IBAN copy). Reimbursements net against the original category. | NL |
| F-22 | **Nibud benchmark** | 1 | Per-category comparison to a reference budget for the household composition. Local, editable, attributed. Never framed as a verdict. | NL |
| F-23 | **Belastingaangifte helper** | 2 | Tag deductibles (giften, specifieke zorgkosten, hypotheekrente, studiekosten if applicable). Box 3 peildatum snapshot on 1 January. Export a summary for the aangifte window (1 Mar – 1 May). Informational only. | NL |
| F-24 | **Huurverhoging forecast** | 2 | Bump the rent line from 1 July by a user-entered or default percentage; show yearly impact. | NL |
| F-25 | **4-weken salarisritme** | 1 | Budget periods of 4 weeks (13/year) as an alternative to calendar months, for CAOs that pay per 4 weeks. | NL |
| F-26 | **Custom period start** | M | Budget month starts on payday (e.g. the 24th), not the 1st. Default is calendar month. | NL |
| F-27 | **Kinderbijslag & SVB** | 2 | Quarterly expected income lines (start of Jan/Apr/Jul/Oct). | NL |
| F-28 | **Feestdagenpotje** | 1 | Sinterklaas / Kerst / verjaardagen with a birthday list, per-person budget, and a target date. | NL |
| F-29 | **Nibud-overzicht PDF** | 2 | One-page budget overview in the layout a budgetcoach or gemeente expects, for intake at schuldhulpverlening. | NL |
| F-30 | **Statiegeld & kortingen** | 3 | Net small supermarket credits against Boodschappen instead of counting them as income. | NL |

## D. Budgeting core

| ID | Feature | Pri | Description | Notes |
|---|---|---|---|---|
| F-31 | Four-bucket budget | M | Vaste lasten / Reserveringen / Huishoudelijk / Vrij besteedbaar. Per-category planned amounts. | `docs/10` §2 |
| F-32 | **Reserveringspotjes** | M | Irregular cost → target amount + due date → automatic monthly set-aside. Progress ring, "je loopt € 40 achter", catch-up suggestion. | NL, `docs/10` §4 |
| F-33 | **Veilig te besteden** | M | The headline number: free money minus fixed costs still due before next income minus this period's set-asides. Explainable in one tap. | `docs/10` §5 |
| F-34 | BTW-potje (ZZP) | 2 | Auto-reserve a % of business income for BTW (21/9%) per quarter and for inkomstenbelasting. | NL |
| F-35 | Rollover | 1 | Per-category carry mode: none / carry surplus / carry surplus and deficit. | `docs/10` §3.4 |
| F-36 | Cashflow forecast | 1 | 90-day daily balance projection from recurring series, planned income and obligations. Low-balance warning with the exact date. | `docs/10` §6 |
| F-37 | Goals (spaardoelen) | 1 | Named goals with target and date; optional linked savings account; progress from real balances. | |
| F-38 | Round-up saving | 3 | Virtual round-ups to a goal (bookkeeping only — we never move money). | |
| F-39 | Budget templates | 1 | Start from a Nibud-shaped template by household type instead of a blank budget. | NL |

## E. Transactions & intelligence

| ID | Feature | Pri | Description | Notes |
|---|---|---|---|---|
| F-40 | Transaction list | M | Grouped by day, sticky headers, virtualised, instant search, filter by account/category/amount/date/tag. | |
| F-41 | Auto-categorisation | M | Rules → merchant dictionary → recurring match → heuristics. Confidence score; low-confidence items surface in a review queue. | `docs/09` |
| F-42 | Learning from corrections | M | Correcting a category offers "altijd zo doen voor <merchant>"; two confirmations create an implicit rule. | |
| F-43 | Rules editor | 1 | Conditions (description contains, counterparty IBAN, amount range, account) → actions (category, tag, scope, exclude). Test-run against history. | |
| F-44 | Splits | M | One transaction across multiple categories and/or people. | |
| F-45 | Recurring detection | M | Detect series by (counterparty, amount ±10%, cadence). Confirm/ignore. Feeds F-17, F-36. | |
| F-46 | Merchant enrichment | 1 | Clean names, logos (local asset pack, no third-party call), MCC-ish grouping. | |
| F-47 | Receipts | 2 | Attach photos; on-device OCR for amount/date suggestion. Stored in Supabase Storage, private bucket. | |
| F-48 | Notes, tags, favourites | 1 | Free tagging, used by exports and filters. | |
| F-49 | Duplicate detection | 1 | Manual entry that matches a synced transaction within ±3 days and exact amount → merge prompt. | |
| F-50 | Search everywhere | 1 | One search field over transactions, categories, potjes, merchants. | |

## F. Insight & reporting

| ID | Feature | Pri | Description | Notes |
|---|---|---|---|---|
| F-51 | Month overview | M | Bucket donut, top categories, in vs uit, compared to last month. | |
| F-52 | Category detail | M | Trend sparkline (12 months), transactions, budget line, Nibud benchmark. | |
| F-53 | Year in review | 2 | December recap: totals per bucket, biggest change, best-saved potje. No gamification. | |
| F-54 | Trends | 1 | Per-category 12-month trend, fixed-cost creep detector ("je vaste lasten stegen € 61 sinds januari"). | |
| F-55 | Ask Kwartje | 3 | Natural-language questions over *your own* aggregated data ("wat gaf ik uit aan boodschappen in juli?"). Server-side, EU-hosted model, no training on user data, opt-in. | |

## G. Engagement & platform

| ID | Feature | Pri | Description | Notes |
|---|---|---|---|---|
| F-56 | Smart notifications | M | Payday, low-balance forecast, big bill in N days, consent expiring, potje behind, unusual charge, subscription price rise. All individually toggleable. | `docs/17` |
| F-57 | Home screen widgets | 1 | iOS/Android widget: "veilig te besteden" + days to payday. Small + medium sizes. | `expo-widgets` |
| F-58 | Quick add | 1 | Widget/shortcut to add an expense in <5 seconds. | |
| F-59 | Weekly digest | 1 | Monday morning summary push + in-app card. | |
| F-60 | Dark mode | M | Full parity. | `docs/12` |
| F-61 | Accessibility | M | 200% dynamic type, VoiceOver/TalkBack, ≥4.5:1 contrast, no colour-only meaning, reduced motion. | |
| F-62 | Localisation | M | nl-NL primary, en-GB secondary. All formats locale-aware. | `docs/15` |
| F-63 | Data export & delete | M | Self-service full export and hard account deletion (AVG art. 17/20). | `docs/16` |
| F-64 | Subscription & paywall | 1 | Free / Plus / Huishouden via RevenueCat; 14-day trial; entitlement checks server-side. | `docs/18` |

---

## MVP definition (v1.0) — the only things that block launch

F-01 · F-02 · F-03 · F-04 · F-05 · F-06 · F-09 · F-10 · F-11 · F-17 · F-21 · F-26 · F-31 · F-32 · F-33 · F-40 · F-41 · F-42 · F-44 · F-45 · F-51 · F-52 · F-56 · F-60 · F-61 · F-62 · F-63

Everything else waits. If a ticket outside this list is blocking an MVP ticket, record it in `DECISIONS.md`.

## Cut-line reasoning

- **Toeslagen (F-13)** is the strongest differentiator but needs careful non-advice copy and legal review → first post-launch release, not MVP.
- **Import (F-07)** is the safety net if PSD2 coverage disappoints → v1.1, kept ready.
- **Household (F-04)** is in MVP because the data model cannot be retrofitted cheaply — even if the UI only exposes a single-member household at launch.
- **Wet Van Dam surfacing (part of F-17)** ships at MVP because subscription pain is the cheapest "wow" we have.
