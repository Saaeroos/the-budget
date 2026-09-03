# 10 — Budget engine

All functions in this document are **pure**, live in `packages/shared/budget/`, take integer cents, and are unit-tested against the fixtures in `docs/19` §3. No React, no I/O, no `Date.now()` (the current date is always a parameter).

---

## 1. Periods

```ts
type PeriodKind = 'calendar_month' | 'custom_month' | 'four_weeks';

function periodFor(date: NLDate, cfg: HouseholdPeriodConfig): Period
```

| Kind | Rule |
|---|---|
| `calendar_month` | 1st 00:00 → last day 23:59, `Europe/Amsterdam` |
| `custom_month` | anchor day `A` (1–28): period starts on the `A`-th of the month and ends the day before the next `A`-th. If `A > days in month`, clamp to the last day. |
| `four_weeks` | 28-day windows from `period_anchor_date`, 13 per year |

Labels: `"maart 2027"`, `"24 mrt – 23 apr"`, `"periode 4 · 2027"`.

**Edge cases to test**: February with anchor 28; DST transitions (period boundaries are dates, not instants — never shift); a household changing `period_kind` mid-period (the current period is closed on the change date and a new one starts the next day; historical periods are never rewritten).

---

## 2. The four buckets

Every category maps to exactly one `category_group` (`docs/06` §6). The bucket totals for a period:

```
bucketPlanned[g]  = Σ budget_lines.planned_cents  where category.group = g
bucketActual[g]   = Σ v_period_actuals.out_cents  where category.group = g
bucketRemaining[g]= max(0, bucketPlanned[g] + carriedIn[g] − bucketActual[g])
bucketOver[g]     = max(0, bucketActual[g] − bucketPlanned[g] − carriedIn[g])
```

`inkomen` and `overboeking` groups are never part of a bucket total.

**Display order is fixed**: vaste lasten → reserveringen → huishoudelijk → vrij besteedbaar. This mirrors Nibud and must not be reordered by amount.

---

## 3. Budget lines

### 3.1 Planned amount sources
1. User-entered (wins always).
2. Derived from a confirmed `recurring_series` (fixed costs auto-fill from `typical_amount_cents`).
3. Derived from an `obligation` monthly set-aside (reserveringen).
4. Suggested from a trailing median of the last 3 comparable periods (huishoudelijk), rounded up to €5.
5. Nibud template default (`budget_templates`, F-39).

The UI shows the source as a subtitle: *"voorgesteld op basis van je laatste 3 maanden"*.

### 3.2 Actuals
From `v_period_actuals`. Rules: splits override the parent; transfers excluded; excluded transactions excluded; **pending** transactions excluded from actuals but shown as a ghost row and included in the forecast.

### 3.3 Available
```
available(line) = planned + carried_in − actual
```
Rendered as a progress bar. Over-budget is shown in amber (not red) with the overage as a separate figure, never as a negative bar.

### 3.4 Rollover
Applied at period roll, then frozen into `carried_in_cents`:

```ts
function carryInto(next: BudgetLine, prev: BudgetLine): Cents {
  const avail = prev.planned + prev.carriedIn - prev.actual;
  switch (prev.rolloverMode) {
    case 'none':          return 0;
    case 'carry_surplus': return Math.max(0, avail);
    case 'carry_all':     return avail;                 // may be negative
  }
}
```

Defaults by group: `vaste_lasten` → `none`; `reserveringen` → `carry_all` (a potje that fell behind must stay behind); `huishoudelijk` → `carry_surplus`; `vrij_besteedbaar` → `none`.

**Invariant**: rolling a period is idempotent. Running `rpc_roll_period` twice produces the same result.

---

## 4. Reserveringspotjes (the differentiator)

An envelope with `kind='reservering'` turns an irregular cost into a monthly line.

### 4.1 Required contribution
```ts
function monthlyContribution(e: Envelope, today: NLDate, cfg: PeriodConfig): Cents {
  if (e.monthlyContributionCents != null) return e.monthlyContributionCents;   // user override
  const remaining = Math.max(0, e.targetCents - e.savedCents);
  if (e.targetDate == null) return 0;                       // open-ended potje: manual only
  const periods = periodsBetween(today, e.targetDate, cfg); // ≥ 1, inclusive of current
  return ceilTo(remaining / Math.max(1, periods), 100);      // round up to whole euros
}
```

### 4.2 Recurring targets
When a potje is for a repeating annual cost (autoverzekering, gemeentebelasting, vakantie), it *recycles*: on the due date, the spent amount is withdrawn, `target_date` advances by the cadence and `saved_cents` retains any surplus.

```ts
function recycle(e: Envelope, spent: Cents, cadence: Cadence): Envelope {
  return { ...e,
    savedCents: Math.max(0, e.savedCents - spent),
    targetDate: addCadence(e.targetDate, cadence) };
}
```

### 4.3 Behind / ahead
```ts
function expectedByNow(e: Envelope, today: NLDate, cfg: PeriodConfig): Cents {
  const total   = periodsBetween(e.startedOn, e.targetDate, cfg);
  const elapsed = periodsBetween(e.startedOn, today, cfg);
  return Math.round(e.targetCents * clamp(elapsed / total, 0, 1));
}
const behindBy = Math.max(0, expectedByNow(e, today, cfg) - e.savedCents);
```

Copy: `Je loopt € 84 achter op Vakantie.` plus one actionable suggestion: *"Verhoog naar € 145 per maand om het te halen"* or *"Verschuif de datum naar juli"*. Two buttons, no lecture.

### 4.4 Priority under pressure
When total required contributions exceed available income, the app does **not** silently reduce them. It shows a *Verdeling* screen listing potjes by `priority` with the shortfall, and lets the user lower, pause or postpone individually. Never auto-drop a potje.

---

## 5. Veilig te besteden (the headline number)

This is the single most important computation in the app. It must be explainable line by line.

```ts
type SafeToSpend = {
  amount: Cents;
  perDay: Cents;
  daysLeft: number;
  components: {
    liquidBalance: Cents;        // sum of included payment-account booked balances
    pendingOut: Cents;           // pending debits not yet booked
    fixedStillDue: Cents;        // confirmed recurring + obligations due before period end
    reservationsDue: Cents;      // this period's potjes contributions not yet set aside
    householdRemaining: Cents;   // remaining budget in huishoudelijk (already committed)
    incomeExpected: Cents;       // income events expected before period end (only 'confirmed')
    buffer: Cents;               // user's minimum buffer setting, default €100
  };
};

function safeToSpend(i: Inputs): SafeToSpend {
  const c = {
    liquidBalance:      sumBalances(i.accounts.filter(a => a.includeInBudget && a.type !== 'savings')),
    pendingOut:         sumPending(i.transactions, 'out'),
    fixedStillDue:      sumDueBefore(i.series.concat(i.obligations), i.today, i.period.endsOn),
    reservationsDue:    sumUnfundedContributions(i.envelopes, i.period),
    householdRemaining: remaining(i.lines.filter(l => l.group === 'huishoudelijk')),
    incomeExpected:     sumConfirmedIncome(i.incomeEvents, i.today, i.period.endsOn),
    buffer:             i.settings.bufferCents,
  };
  const amount =
      c.liquidBalance
    - c.pendingOut
    + c.incomeExpected
    - c.fixedStillDue
    - c.reservationsDue
    - c.householdRemaining
    - c.buffer;
  const daysLeft = daysBetween(i.today, i.period.endsOn) + 1;
  return { amount, perDay: Math.floor(amount / daysLeft), daysLeft, components: c };
}
```

Rules:
- `incomeExpected` counts **only** income events the user confirmed or that have ≥3 historical occurrences at a stable amount. Never optimistic.
- Savings accounts are excluded from `liquidBalance` by default (toggleable per account).
- If `amount < 0` the UI shows `€ 0` as the headline with a red sub-line: `Je komt € 142 tekort deze periode.` and links to the forecast.
- The explanation sheet lists every component with its own tap-through. This sheet is not optional — it is what makes the number trustworthy.

**Never** display a "safe to spend" number when there is no bank balance and no manual balance — show `Onbekend` with a prompt to add a starting balance instead. A wrong number here destroys trust permanently.

---

## 6. Cashflow forecast (90 days)

```ts
function forecast(i: ForecastInputs): DayPoint[] {
  let balance = i.startingBalance;                       // today's liquid balance
  const events = [
    ...expandSeries(i.series, i.today, +90),             // recurring debits/credits
    ...expandObligations(i.obligations, i.today, +90),   // incl. instalments
    ...expandIncome(i.incomeEvents, i.today, +90),       // salary, toeslagen, kinderbijslag, vakantiegeld
    ...pendingTransactions(i),
  ].sort(byDate);

  const dailyVariable = trailingMedianDailySpend(i.transactions, 90, 'huishoudelijk');

  return eachDay(i.today, +90).map(day => {
    balance -= dailyVariable;
    for (const e of eventsOn(events, day)) balance += e.signedAmount;
    return { day, balance, low: balance < i.settings.bufferCents };
  });
}
```

- `trailingMedianDailySpend` uses the median of daily huishoudelijk spend over the last 90 days, excluding the top 2% outliers, so one IKEA trip does not poison the projection.
- The first `low` day is the **headline warning**: `Op 22 maart sta je onder je buffer (€ -40).`
- The chart shows the projected line, a shaded buffer band, and markers for the three biggest upcoming events.
- Recompute triggers: new transactions, budget change, envelope change, obligation change, once nightly.

---

## 7. Income-ratio splitting (households)

For shared costs when members chose *naar draagkracht*:

```ts
function splitByIncome(amount: Cents, members: Member[]): Map<UserId, Cents> {
  const total = sum(members.map(m => m.netMonthlyIncomeCents));
  if (total === 0) return splitEqually(amount, members);
  const raw = members.map(m => ({ id: m.id, v: (amount * m.netMonthlyIncomeCents) / total }));
  return largestRemainder(raw, amount);   // guarantees Σ === amount, no lost cent
}
```

`largestRemainder` is mandatory — naive rounding loses cents and users notice. Unit-test with amounts that do not divide evenly (e.g. €100 across 3 people → 33.34 / 33.33 / 33.33).

---

## 8. Nibud benchmark (F-22)

```ts
function benchmark(categoryKey: string, h: Household, actual: Cents): Benchmark | null {
  const ref = nibudReference(h.composition, h.incomeBand, categoryKey);
  if (!ref) return null;
  const delta = actual - ref.amountCents;
  return { reference: ref.amountCents, delta, ratio: actual / ref.amountCents, source: ref.sourceNote };
}
```

Presentation rules:
- Always neutral: `Vergelijkbare huishoudens: € 480 · jij: € 520`.
- Never "too much", never a colour judgement, never a score.
- Always show the source and year, and a link to edit the reference locally.

---

## 9. Vakantiegeld planner (F-14)

```ts
function estimateVakantiegeld(grossAnnualCents: Cents): Cents {
  return Math.round(grossAnnualCents * 0.08);   // statutory minimum 8%
}
```
The *net* payout is materially lower because holiday allowance is taxed at the bijzonder tarief. **Do not compute net.** Ask the user for last year's actual net amount, default to that, and label the 8% figure clearly as *bruto, schatting*. Getting this wrong would be a tax calculation we are not licensed to make.

Flow: in April, prompt *"Wat doe je met je vakantiegeld?"* → allocate across potjes/goals/free with a sum bar that must equal the expected amount before saving.

---

## 10. Rounding & display

- All internal math in integer cents. Division rounds with an explicit strategy (`ceilTo`, `floorTo`, `largestRemainder`), never bare `Math.round` on a distribution.
- Display: `formatEUR(cents, { decimals: 'auto' })` — hides `,00` on whole euros in compact contexts (chips, bars) and always shows two decimals in ledgers and detail rows.
- Percentages shown to 0 decimals, never > 999%.
- A value of exactly 0 renders as `€ 0`, never `-€ 0`.

---

## 11. Test matrix (must all exist)

| Case | Expectation |
|---|---|
| Custom period anchored on 31 in February | Clamps to 28/29, no gap, no overlap |
| Period kind changed mid-period | Old period closed, new starts next day, history intact |
| Rollover `carry_all` with a deficit | Negative `carried_in` propagates once, not twice |
| Roll executed twice | Identical result (idempotent) |
| Potje with target date in the past | Contribution = full remaining, marked `te laat` |
| Potje target reached early | Contribution = 0, surplus retained |
| Safe-to-spend with no balance data | Returns `unknown`, not 0 |
| Safe-to-spend where fixed costs > balance | Negative → UI shows €0 + shortfall line |
| Forecast with a €2400 annual bill in 40 days | Low-balance day identified exactly |
| Split €100 / 3 members | 33.34 + 33.33 + 33.33 = 100.00 |
| Income-ratio split with a zero-income member | Falls back to equal split |
| Statiegeld credit at Albert Heijn | Nets against boodschappen, not counted as income |
| Pending debit of €80 | Excluded from actuals, included in safe-to-spend and forecast |
