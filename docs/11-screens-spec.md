# 11 — Screen specifications

## State matrix (applies to every screen)

Every screen must implement all of these. A PR without them is not done.

| State | Requirement |
|---|---|
| **Loading** | Skeletons that match the final layout. No spinners on full screens. Max 400ms before skeleton appears (avoid flash). |
| **Empty** | Illustration or icon + one sentence explaining what goes here + one primary action. Teaches, does not decorate. |
| **Error** | Human sentence (mapped from an error code, `docs/14` §5), a retry button, and a way out. Never a raw error string. |
| **Offline** | Show cached data with a subtle "offline" chip. Writes queue silently. Never block the screen. |
| **Stale** | When bank data is older than 24h or consent expired: an inline banner "Laatst bijgewerkt: di 1 sep" + refresh action. |
| **Success** | The real thing. |

---

## 1. Onboarding

### 1.1 Welkom `(auth)/welkom`
Three stacked value cards, swipe or scroll: *Al je banken in één overzicht* · *Potjes voor rekeningen die later komen* · *Je gegevens blijven in Europa*. Primary: **Beginnen**. Secondary: **Ik heb al een account**.
Below the fold, always visible: `Alleen-lezen. Kwartje kan nooit geld overmaken.`

### 1.2 Inloggen `(auth)/inloggen` → `code`
Email field → 6-digit code screen with auto-fill from SMS/email, 60s resend timer, paste support. Apple/Google buttons above the fold on their respective platforms only.

### 1.3 Huishouden `(onboarding)/huishouden`
- Samenstelling: alleenstaand / samenwonend / met kinderen (segmented + kids stepper)
- Wanneer krijg je je inkomen? → `1e van de maand` / `een vaste dag` (day picker) / `elke 4 weken` (date picker)
- Sets `period_kind`, `period_anchor_day|date`, `composition`, `adults`, `children`.
- Copy is conversational: *"Wanneer komt je salaris binnen?"* not "Select period anchor".

### 1.4 Bank `(onboarding)/bank`
- Search field + grid of the 8 most-used NL banks with logos, then "Alle banken" list.
- Each bank row may carry a warning line (e.g. ABN AMRO: `Creditcards kunnen niet worden gekoppeld.`).
- Prominent secondary: **Handmatig beginnen** — never buried. ~30% of users will not connect a bank on day one and must not be blocked.
- Tapping a bank → `bank-koppelen/[institutionId]`: a short "wat gebeurt er nu" explainer (3 bullets: je logt in bij je bank · wij lezen alleen · geldig voor 90 dagen), then opens the auth session.
- On return: progress screen while the initial sync runs, with real counts ("312 transacties opgehaald"). Never a fake progress bar.

### 1.5 Vaste lasten bevestigen `(onboarding)/categorieen`
Detected recurring costs as a checklist with amount and cadence. Tap to fix a category. **Doorgaan** enabled always; nothing is mandatory.

### 1.6 Eerste potje `(onboarding)/eerste-potje`
The aha moment. Suggests 3 potjes based on detected data (e.g. Autoverzekering — maart — € 480 → € 40/maand). User picks one, sees the monthly number appear, and lands on Vandaag. If nothing detected, offer Vakantie / Kleding / Onverwachte kosten.

---

## 2. Vandaag `(tabs)/index`

Sections in fixed order (see `docs/05` §4).

**Header**: avatar (→ instellingen), household switcher if >1, period label with a chevron (→ period picker).

**Hero card**
- `€ 412` in `display-xl`, label `Veilig te besteden` , sub-line `nog 11 dagen · € 37 per dag`.
- Tap → explanation sheet listing every component from `docs/10` §5 with amounts and tap-through.
- Long-press → toggle between "veilig te besteden" and "saldo".
- Negative case: `€ 0` + red sub-line `Je komt € 142 tekort deze periode.` → forecast.
- Unknown case: `Onbekend` + `Voeg een beginsaldo toe`.

**Komt eraan** — horizontal cards for the next 14 days: date chip, name, amount, category icon. Red left border if it lands on/after a forecast low day. Tap → the series/obligation. "Alles bekijken" → forecast screen.

**Te controleren** — one row per bucket of work: `12 transacties zonder categorie`, `3 mogelijk gesplitst`, `1 abonnement duurder geworden`. Tap → filtered transaction list in review mode (swipe through, one-tap categorise, undo).

**Potjes achterstand** — only when ≥1 potje is behind. Shows the worst two.

**Recente transacties** — 5 rows + "Alles bekijken".

Pull-to-refresh triggers a rate-limited sync. Refresh control shows `Bijwerken bij ING…` with the institution name.

---

## 3. Transacties `(tabs)/transacties`

**List**: `FlashList`, grouped by day with sticky date headers (`vandaag`, `gisteren`, `di 1 sep`). Row = merchant logo/initial · name · category chip · amount (right, `out` neutral, `in` green). Pending rows are 60% opacity with a `in behandeling` chip.

**Search**: header field, debounce 250ms, searches `description_clean`, `counterparty_name`, `note`, `tags`, amount (typing `12,50` matches amounts).

**Filters** (chip row, horizontally scrollable): Periode · Rekening · Categorie · Bedrag · Type (uitgaven/inkomsten/overboekingen) · Alleen te controleren · Tags. Active filters shown as removable chips; a "Wis alles" chip appears when >1 active.

**Swipe actions**: left → categoriseren (opens the category sheet); right → uitsluiten / splitsen.

**Multi-select**: long-press enters selection mode → bulk categorise, bulk tag, bulk exclude, create rule from selection.

**Review mode** (entered from *Te controleren*): a focused, one-at-a-time card stack. Big merchant name, amount, suggested category with confidence, three suggested alternatives, and "Altijd zo doen". Swipe to accept.

### 3.4 Transactie detail `transacties/[id]`
Amount hero · merchant · date · account · raw description (collapsible, monospace) · category picker · scope toggle (persoonlijk/huishouden) · tags · note · attachments · "Onderdeel van reeks: Netflix" link · Splits section · Regel maken · Uitsluiten van budget · Verwijderen (manual only).
Bank-sourced fields (amount, date, description) are read-only with a lock icon and an explanation on tap.

---

## 4. Potjes `(tabs)/potjes`

Header shows `Totaal gereserveerd € 1.240` and `Deze maand opzij: € 265`.

**List** of envelope cards: name, progress ring (saved/target), `nog € 320 · voor 1 maart`, monthly contribution, and a status chip (`op schema` / `€ 84 achter` / `klaar`).
Sorted: behind first, then by target date.

**FAB** → `modals/potje-nieuw`: name, target amount, target date, category link, cadence (eenmalig/jaarlijks/per kwartaal), priority. Live preview: *"Dat is € 145 per maand."*

**Suggesties** section: potjes the app can infer from obligations/series that don't have one yet.

### 4.3 Potje detail `potjes/[id]`
Ring + numbers · timeline of contributions and withdrawals · "Bedrag aanpassen" · "Datum verschuiven" · "Geld eruit halen" (records a withdrawal, links to a transaction) · "Pauzeren" · linked account (optional) · history chart.

---

## 5. Overzicht `(tabs)/overzicht`

**Period switcher** (segmented arrows, current period default).

**Bucket donut**: 4 segments in fixed bucket order and fixed colours. Centre shows total uitgaven. Legend rows with planned vs actual and a slim progress bar each.

**In vs uit** bar pair with the difference stated in words: `Je hield € 240 over.` / `Je kwam € 90 tekort.`

**Top categorieën** — 5 rows, amount + delta vs previous period.

**Vaste lasten creep** card (F-54) when detected: `Je vaste lasten zijn € 61 hoger dan in januari.` → trends.

### 5.3 Categorie detail `overzicht/categorie/[id]`
12-month bar sparkline · this period's budget line with editable planned amount · Nibud benchmark row (F-22) · transaction list filtered to the category · "Regel maken voor deze categorie".

### 5.4 Trends `overzicht/trends`
Multi-line 12-month chart, selectable categories, with a fixed-cost vs variable toggle. Pinch to zoom is not required; a period segmented control is.

---

## 6. Budget bewerken `budget/index`
Grouped by bucket, in fixed order. Each row: category, planned amount (inline numeric input), source subtitle, rollover mode (long-press menu). Sticky footer: `Gepland € 2.840 · Inkomen € 3.100 · Over € 260`. Footer turns amber if planned > income, with the exact shortfall.
Action: **Vul in op basis van mijn geschiedenis** (fills every empty line from the 3-period median).

---

## 7. Rekeningen `rekeningen/index`
Grouped by connection. Connection header: bank logo, `Bijgewerkt 2 uur geleden`, consent chip (`Geldig tot 12 dec` / amber `Verloopt over 6 dagen` / red `Verlopen`).
Account rows: name, IBAN last 4, balance, include-in-budget toggle, scope.
Actions: **Nu bijwerken**, **Opnieuw koppelen**, **Koppeling verwijderen** (confirm sheet explains transactions are kept).
Add: **Bank koppelen** and **Handmatige rekening**.

### 7.3 Koppeling `rekeningen/koppeling/[id]`
Consent details, what we can see, when it expires, sync history (last 10 runs with counts and errors), revoke.

---

## 8. Abonnementen `abonnementen/index`
Total per month and per year at the top. List: logo, name, amount, cadence, `volgende afschrijving 3 okt`. Badges: `duurder geworden` (+ delta), `waarschijnlijk maandelijks opzegbaar vanaf …`, `niet afgeschreven` (missed).
Detail: history chart of the amount over time, contract start input, cancel link (opens provider page in the browser), "Markeer als opgezegd".
Copy guard: never claim we can cancel anything, never state a legal right as certain.

---

## 9. Splits `splits/index`
Open items grouped by person: `Fleur — € 42,50 (2 items)`. Actions: **Herinner via Tikkie/Wero** (opens a share sheet with a prefilled message and an amount, or copies the IBAN), **Markeer als betaald**.
Creating a split: from a transaction → choose people (from a local, device-only contact list the user types; no address-book upload) → equal / by shares / by amounts → the app keeps only the user's own share in their budget.

---

## 10. Instellingen
`profiel` · `huishouden` (members, invite, income shares) · `categorieen` (hide/create/reorder) · `regels` (list, edit, test-run) · `meldingen` (per-type toggles, quiet hours) · `beveiliging` (app lock, biometrics, auto-lock delay) · `abonnement` (plan, manage, restore) · `privacy` (export, delete, what we store, DPIA summary) · `over` (version, licenties, contact).

---

## 11. Snel toevoegen `modals/snel-toevoegen`
Opens with the numeric pad focused. Amount → direction toggle (uit/in) → category (recent 6 + search) → optional account, date (default today), note. Save in ≤3 taps for the common case. Haptic on save. Undo snackbar for 5 seconds.

---

## 12. Paywall `modals/paywall`
Shown on: 2nd bank connection, forecast >30 days, household invite, export, toeslagen module. Never on app open, never full-screen-blocking on day 1.
Content: what Plus adds (4 bullets, concrete), price monthly/yearly with the yearly saving stated in euros, 14-day trial, `Opzeggen kan altijd`, restore purchases, link to terms. No countdown timers, no fake scarcity.

---

## 13. Motion & haptics
- Screen transitions: native stack defaults. No custom page animations.
- Numbers that change (safe-to-spend, potje progress) animate with a 300ms spring count-up on first render only, never on re-render.
- Haptics: `selection` on category pick, `success` on save, `warning` on over-budget, none on scroll.
- Respect `prefers-reduced-motion` / `AccessibilityInfo.isReduceMotionEnabled` — disable count-ups and springs.
