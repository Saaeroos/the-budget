# 02 — The Dutch market: research & implications

Everything in this file is a *constraint on the product*. Each subsection ends with **→ Implications** that map to features and tickets.

---

## 1. Banking landscape

| Bank | Share of NL current accounts (approx.) | Notes for us |
|---|---|---|
| ING | ~1/3 | Redirect SCA; desktop needs QR scan via mobile app |
| Rabobank | ~1/4 | Redirect SCA; QR on desktop; strong among rural/family segments |
| ABN AMRO | ~1/5 | **Credit cards are out of PSD2 scope** — cannot be synced |
| de Volksbank (SNS, ASN, RegioBank) | ~1/10 | Three brands, one backend |
| bunq | growing, urban/young | Full public API in addition to PSD2; sub-accounts ("potjes") map to our envelopes |
| Revolut, N26, Knab, Triodos, Van Lanschot | long tail | Van Lanschot has no automatic app-switch on mobile |

Facts that shape the sync engine:
- All Dutch ASPSPs use **redirect-based SCA**, with automatic app-switch on mobile when the bank app is installed.
- All support SEPA Credit Transfer in EUR; most support SCT Inst.
- Business users authenticate with **eHerkenning** or bank tokens — out of scope for v1.
- Transaction history depth varies by bank (typically 12–24 months on first consent; some limit to 90 days without fresh SCA).

**→ Implications**
- Onboarding must show a bank picker with logos and a per-bank warning line (e.g. "ABN AMRO creditcards kunnen niet worden gekoppeld").
- Sync engine must not assume history depth; it backfills as far as the bank allows and records `history_available_from` per account.
- bunq gets an optional richer adapter in v2 (sub-account → envelope mapping).

---

## 2. PSD2 today, PSD3 tomorrow

- Under PSD2, an AIS **consent expires after 90 days** and requires fresh SCA. This is the single biggest retention hazard for a bank-connected app.
- **PSD3 + PSR**: political agreement reached; publication in the Official Journal expected in the first half of 2026, then ~18 months transition — realistic market readiness **2028**. Improvements include standardised interfaces and mandatory permission dashboards at the bank.
- **FiDA** (open finance, beyond payment accounts) remains uncertain in scope and timing — do not build on it.
- Consequence: design for 90-day re-consent now; treat any relaxation as a bonus.

**→ Implications**
- `bank_consents.expires_at` is a first-class field. Re-consent campaign at T-14, T-7, T-2 days and on expiry (`docs/17` §3).
- The app must degrade gracefully to "last synced on …" rather than showing an empty state when consent lapses.
- Never claim "always up to date" in marketing copy.

---

## 3. Payments culture

- **iDEAL** is the dominant online payment method; it is being **phased into Wero** (European Payments Initiative): co-branded iDEAL|Wero logo from Q1 2026, full migration targeted **end of 2027**.
- **Tikkie** (ABN AMRO) is the default P2P settlement method — the verb "tikkie me" is in everyday Dutch. Wero adds P2P and request-to-pay natively.
- Cash is marginal; contactless debit ("pinnen") dominates in-store. Statiegeld (€0.15/€0.25 deposit) refunds appear as small supermarket credits.

**→ Implications**
- Transaction descriptor parser must recognise both `iDEAL` and `Wero` families, plus `Tikkie`, `Betaalverzoek`, `SEPA overboeking`.
- Shared-expense feature settles via a *link out* (Tikkie/Wero/plain IBAN), never by moving money ourselves.
- Statiegeld credits should not be miscategorised as income — they net against Boodschappen (`docs/09` §5.3).

---

## 4. The Nibud model — our core abstraction

Nibud (Nationaal Instituut voor Budgetvoorlichting) is the authority every gemeente, debt counsellor and school uses. Its household budget is structured in four groups:

1. **Vaste lasten** — huur/hypotheek, energie, water, gemeentelijke belastingen, waterschapsbelasting, verzekeringen, telefoon/internet, abonnementen, aflossingen, kinderopvang.
2. **Reserveringsuitgaven** — kleding & schoenen, inventaris & onderhoud, vakantie, niet-vergoede ziektekosten (incl. eigen risico), contributies, cadeaus/feestdagen, autoonderhoud & APK.
3. **Huishoudelijke uitgaven** — boodschappen, was- & schoonmaakmiddelen, persoonlijke verzorging, huisdieren.
4. **Vrij besteedbaar / sparen** — everything left.

Nibud publishes **referentiebegrotingen** (reference budgets) per household composition and income — a trusted benchmark Dutch users already believe in.

**→ Implications**
- `category_groups` is a fixed enum of these four. Categories belong to exactly one group. This is not user-editable.
- Bucket 2 drives the *potjes* engine: every irregular cost becomes a target amount + due date, and the app computes the monthly set-aside.
- A "vergelijk met Nibud" benchmark row appears on category detail screens. **Licensing note**: Nibud reference figures are Nibud's IP. Ship with a *user-editable local reference table* seeded from publicly published figures, clearly attributed, and obtain permission before using their data commercially (`docs/16` §8).

---

## 5. The Dutch financial calendar

This calendar is data, seeded in `supabase/seed/nl_calendar.sql`, and drives suggested obligations and notifications.

| When | Event | Product hook |
|---|---|---|
| Monthly, 20th–22nd | **Toeslagen** paid (zorgtoeslag, huurtoeslag, kindgebonden budget, kinderopvangtoeslag) for the *following* month | Expected-income line; mismatch alert |
| Monthly, 24th–last working day | Salary for most CAOs. Some sectors pay **per 4 weeks** (13 periods/year) | Custom period start; 4-week budget mode |
| Quarterly (start of Jan/Apr/Jul/Oct) | **Kinderbijslag** (SVB) | Expected-income line |
| Quarterly | **Motorrijtuigenbelasting** (road tax) | Recurring obligation |
| January | New year: premies, eigen risico resets, indexations, box 3 **peildatum 1 januari** | "Nieuwjaar-check" flow |
| Jan–Mar | **Energie jaarafrekening** for many contracts | Settlement forecast (refund or bill) |
| Feb–Mar | **Gemeentelijke belastingen** (OZB, afvalstoffen-, rioolheffing) + **waterschapsbelasting**; payable in ~8–10 monthly instalments by incasso; **kwijtschelding** possible on low income | Big-bill warning + instalment suggestion + kwijtschelding hint |
| 1 Mar – 1 May | **Belastingaangifte** window | Aftrekposten export |
| May | **Vakantiegeld** — statutory 8% of gross annual salary, usually paid with May salary | Windfall planner |
| 1 July | Annual **huurverhoging** takes effect | Forecast bump on the rent line |
| Jul–Aug | Summer holiday spend peak; school holiday regions differ (noord/midden/zuid) | Vakantiepotje target date |
| Sep | Prinsjesdag — next-year figures announced | Content/notification moment |
| Nov | **Sinterklaas** spend; some CAOs pay a **13e maand** | Feestdagenpotje |
| Nov–Dec | **Zorgverzekering** switch window: cancel by **31 December**, choose a new policy by **31 January** | Annual reminder + premium/eigen risico comparison prompt |
| Dec | Kerst, plus year-end box 3 planning | Year-in-review |

**→ Implications**
- Seeded `obligation_templates` with month, typical amount range, and whether instalments are common.
- Notification engine has a *calendar* source in addition to a *forecast* source (`docs/17`).

---

## 6. Merchants & descriptors

Seed dictionary (non-exhaustive; full list in `supabase/seed/nl_merchants.sql`):

- **Boodschappen**: Albert Heijn / AH to go, Jumbo, Lidl, Aldi, Plus, Dirk, Coop, Spar, Picnic, Ekoplaza, Vomar, Hoogvliet, Nettorama, Poiesz
- **Drogist/verzorging**: Etos, Kruidvat, Trekpleister, Douglas, ICI Paris
- **Huis & tuin**: Action, HEMA, Blokker, Praxis, Gamma, Karwei, Hornbach, IKEA, Xenos
- **Vervoer**: NS, OV-chipkaart / OVpay, GVB, RET, HTM, Arriva, Connexxion, Q-Park, Shell, BP, Esso, Tango, Fastned, Greenwheels, Swapfiets, Felyx, Check
- **Telecom/energie**: KPN, Odido, Vodafone, Ziggo, Simyo, Eneco, Vattenfall, Essent, Greenchoice, Budget Energie, Vandebron, Waternet/Vitens/Evides
- **Verzekering/zorg**: Zilveren Kruis, VGZ, CZ, Menzis, DSW, ONVZ, Univé, Centraal Beheer, Interpolis, FBTO, Ohra, Nationale-Nederlanden
- **Overheid**: Belastingdienst, Belastingdienst/Toeslagen, SVB, UWV, DUO, CJIB (fines), gemeente *, waterschap *, RDW
- **Bezorging/eten**: Thuisbezorgd, Uber Eats, Domino's, New York Pizza, Flink, Gorillas (hist.), Crisp
- **Abonnementen**: Netflix, Spotify, Videoland, Disney+, HBO Max, Ziggo Sport, NPO Plus, Basic-Fit, SportCity, Fit For Free, Strava, iCloud, Google One
- **Retail/online**: bol, Coolblue, Amazon.nl, Wehkamp, Zalando, Decathlon, MediaMarkt, Marktplaats, Vinted
- **Fintech/P2P**: Tikkie, Wero, iDEAL, PayPal, Klarna, in3, Riverty/AfterPay, Billink

Descriptor patterns worth normalising (see `docs/09` §4):
- `SEPA iDEAL IBAN: NL.. BIC: .. Naam: <merchant> Omschrijving: <ref>`
- `BEA, Betaalpas <merchant>,PAS123` / `BEA, Apple Pay <merchant>`
- `SEPA Incasso algemeen doorlopend Incassant: <creditor> Naam: <merchant>`
- `/TRTP/iDEAL/...` structured tags on some banks
- `Tikkie` / `Betaalverzoek` with a free-text note
- Wero descriptors appearing alongside/replacing iDEAL through 2026–2027

---

## 7. Competitor landscape (NL)

| Product | Model | Strength | Gap we exploit |
|---|---|---|---|
| **Bank apps** (ING Kijk Vooruit, Rabo Financieel Inzicht, ABN Grip) | Free, bank-owned | Trusted, zero setup | Single bank only; no bucket model; no set-aside engine |
| **Dyme** | Freemium (~€7–10/mo tiers) | Subscription cancellation, fixed-cost focus | Limited bank coverage; categorisation complaints; expensive |
| **iBilly** | Free 1 account, ~€2/mo unlimited | Broad bank coverage, good dashboard | Weak on Dutch calendar/reserveringen; no household split |
| **MijnGeldzaken** | Free + ~€2.45/mo, PSD2 add-on | Long-term planning | Dated UX, web-first |
| **bunq / N26 built-ins** | Free with account | Real-time, elegant | Only their own account |
| **Monefy / Money Manager / SayMoney** | Free/ads | Simple manual entry | No bank sync, no NL context, ads |
| **YNAB** | ~$15/mo, USD | Strong method, loyal users | American mental model, expensive, weak EU bank coverage, English |
| **Kasboek.nl** | Web only | Import-driven | No mobile app, fixed categories |

**Positioning gap**: nobody owns *"multi-bank + Nibud buckets + Dutch calendar + set-aside automation"* at a sub-€5 price with a modern mobile UX.

---

## 8. Regulatory & trust context

- **AISP**: reading bank accounts is a regulated activity. Kwartje operates **under the aggregator's licence** as a technical service provider (or as its registered agent). This must be legally confirmed before public launch. See `docs/16` §7.
- **AFM**: giving *advies* on financial products (insurance, mortgages, credit) requires a licence. Kwartje shows facts, comparisons against public norms, and reminders — never "switch to insurer X". Any comparison feature must be non-recommending and disclose that it is not advice.
- **AVG/GDPR**: financial transaction data is high-risk profiling; a **DPIA is required**. Lawful basis: contract (Art. 6(1)(b)) for core sync, consent for optional enrichment. Data hosted in the EU. Full export and hard delete must be self-service.
- **Consumer law**: 14-day withdrawal right on digital subscriptions; **Wet Van Dam** means most NL subscriptions become monthly-cancellable with ≤1 month notice after the first year — our own pricing must comply, and our subscription radar can surface this for the user's other contracts.
- Dutch users are notably privacy-sensitive and read the "waar staat mijn data" question as a purchase criterion.

---

## 9. Language & tone

- Address the user as **je/jij**. `u` only in legal texts.
- Currency: `€ 1.234,56` — dot thousands, comma decimals, non-breaking space after `€`.
- Dates: `di 3 sep`, `03-09-2026`, week numbers used casually ("week 36"). Monday is the first day of the week.
- Big numbers spoken as `12,5 duizend`? No — always full figures in finance.
- Avoid English loanwords where a normal Dutch word exists: *uitgaven* not "expenses", *overzicht* not "dashboard", *potje* not "envelope", *koppelen* not "connecten".
- Do **not** exclaim. `Je bent er bijna.` beats `Bijna klaar! 🎉`.
- Negative balances are stated plainly: `Je komt € 42 tekort op 22 maart.`

---

## 10. Sources

- [Open Banking Tracker — Netherlands providers](https://www.openbankingtracker.com/providers/country/nl)
- [Open Banking Tracker — free & indie open banking APIs 2026](https://www.openbankingtracker.com/guides/free-open-banking-apis)
- [Enable Banking — Open banking specifics in the Netherlands](https://enablebanking.com/docs/markets/nl/)
- [Worldline — PSD3/PSR scope and timeline](https://worldline.com/en/home/main-navigation/resources/blogs/2026/the-scope-and-timeline-are-locked-in-for-psd3-and-psr-what-should-psps-know)
- [CM.com — iDEAL to Wero: complete guide 2026–2027](https://www.cm.com/blog/ideal-to-wero-what-merchants-need-to-know-about-the-transition/)
- [Betaalvereniging Nederland — iDEAL and Wero](https://www.betaalvereniging.nl/en/knowledge-base/online-payments/ideal-wero/)
- [Nibud — referentiebegrotingen](https://www.nibud.nl/samenwerken/cijfers-en-rekentools/referentiebegrotingen/)
- [Nibud — huishoudelijke uitgaven](https://www.nibud.nl/onderwerpen/uitgaven/huishoudelijke-uitgaven/)
- [Financer.nl — huishoudboekje app vergelijking](https://financer.nl/persoonlijke-financien/huishoudboekje-app/)
- [Zorgwijzer — zorgtoeslag 2026 bedragen en betaaldata](https://www.zorgwijzer.nl/faq/zorgtoeslag)
- [ABN AMRO Developer Portal — Tikkie API](https://developer.abnamro.com/api-products/tikkie)
- [Expo SDK 55 changelog](https://expo.dev/changelog/sdk-55)
