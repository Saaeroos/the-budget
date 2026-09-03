# 05 — Information architecture

## 1. Navigation model

Bottom tab bar, 5 tabs, native tabs (`expo-router` v7 `NativeTabs`).

```
(tabs)
├── index            Vandaag      "Home"
├── transacties      Transacties
├── [fab]            + (centre action, not a tab — opens Snel toevoegen sheet)
├── potjes           Potjes
└── overzicht        Overzicht
```

Settings lives behind the avatar in the Vandaag header, not in the tab bar.

## 2. Route tree (expo-router)

```
app/
├── _layout.tsx                         # root: providers, theme, app lock gate
├── (auth)/
│   ├── _layout.tsx
│   ├── welkom.tsx                      # value prop, 3 cards
│   ├── inloggen.tsx                    # email OTP / Apple / Google
│   └── code.tsx                        # OTP entry
├── (onboarding)/
│   ├── _layout.tsx                     # progress bar, resumable
│   ├── huishouden.tsx                  # composition, income rhythm, period start
│   ├── bank.tsx                        # bank picker OR "handmatig beginnen"
│   ├── bank-koppelen/[institutionId].tsx
│   ├── categorieen.tsx                 # confirm detected fixed costs
│   └── eerste-potje.tsx                # the aha moment
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx                       # Vandaag
│   ├── transacties/
│   │   ├── index.tsx
│   │   └── [id].tsx
│   ├── potjes/
│   │   ├── index.tsx
│   │   └── [id].tsx
│   └── overzicht/
│       ├── index.tsx
│       ├── categorie/[id].tsx
│       └── trends.tsx
├── budget/
│   ├── index.tsx                       # edit the plan, per bucket
│   └── categorie/[id].tsx
├── rekeningen/
│   ├── index.tsx
│   ├── [id].tsx
│   └── koppeling/[connectionId].tsx    # consent status, renew, remove
├── abonnementen/
│   ├── index.tsx
│   └── [seriesId].tsx
├── splits/
│   ├── index.tsx
│   └── [id].tsx
├── instellingen/
│   ├── index.tsx
│   ├── profiel.tsx
│   ├── huishouden.tsx
│   ├── categorieen.tsx
│   ├── regels.tsx
│   ├── meldingen.tsx
│   ├── beveiliging.tsx
│   ├── abonnement.tsx                  # our paywall / subscription mgmt
│   ├── privacy.tsx                     # export, delete, DPIA summary
│   └── over.tsx
├── modals/
│   ├── snel-toevoegen.tsx              # the FAB sheet
│   ├── potje-nieuw.tsx
│   ├── splitsen.tsx
│   ├── categorie-kiezen.tsx
│   ├── periode-kiezen.tsx
│   └── paywall.tsx
└── +not-found.tsx
```

Routing rules:
- Route files are thin: they compose a screen component from `src/features/*` and set navigation options. No queries, no logic.
- All modals use `presentation: 'modal'` on iOS, bottom-sheet style on Android.
- Deep links: `kwartje://` scheme + universal links on `kwartje.nl`. Bank redirect returns to `kwartje://bank/callback?ref=...` (see `docs/08` §5).

## 3. Screen inventory

| Screen | Route | Purpose | Spec |
|---|---|---|---|
| Welkom | `(auth)/welkom` | Value prop, privacy promise | 11 §1.1 |
| Inloggen / Code | `(auth)/inloggen`, `/code` | Passwordless auth | 11 §1.2 |
| Huishouden instellen | `(onboarding)/huishouden` | Composition, period start, income rhythm | 11 §1.3 |
| Bank kiezen / koppelen | `(onboarding)/bank*` | PSD2 connect or manual start | 11 §1.4 |
| Vaste lasten bevestigen | `(onboarding)/categorieen` | Confirm detected recurring costs | 11 §1.5 |
| Eerste potje | `(onboarding)/eerste-potje` | Aha moment | 11 §1.6 |
| **Vandaag** | `(tabs)/index` | Veilig te besteden + what's coming | 11 §2 |
| Transacties | `(tabs)/transacties` | Ledger, search, filter, review queue | 11 §3 |
| Transactie detail | `transacties/[id]` | Recategorise, split, note, rule | 11 §3.4 |
| Potjes | `(tabs)/potjes` | All reserveringen + goals | 11 §4 |
| Potje detail | `potjes/[id]` | Target, due date, contributions | 11 §4.3 |
| Overzicht | `(tabs)/overzicht` | Buckets, month vs month | 11 §5 |
| Categorie detail | `overzicht/categorie/[id]` | Trend, transactions, Nibud benchmark | 11 §5.3 |
| Trends | `overzicht/trends` | 12-month lines, fixed-cost creep | 11 §5.4 |
| Budget bewerken | `budget/index` | Plan per bucket/category | 11 §6 |
| Rekeningen | `rekeningen/index` | Accounts, balances, sync status | 11 §7 |
| Koppeling | `rekeningen/koppeling/[id]` | Consent expiry, renew, delete | 11 §7.3 |
| Abonnementen | `abonnementen/index` | Subscription radar | 11 §8 |
| Splits | `splits/index`, `/[id]` | Shared costs, who owes what | 11 §9 |
| Instellingen (×9) | `instellingen/*` | Config | 11 §10 |
| Snel toevoegen | `modals/snel-toevoegen` | Add expense in <5s | 11 §11 |
| Paywall | `modals/paywall` | Plus upsell | 11 §12 |

## 4. Information hierarchy on Vandaag

Ordered by what a user needs in the first 3 seconds:

1. **Veilig te besteden** — one big number, the period it applies to, one-tap explanation.
2. **Tot aan salaris** — days remaining and daily allowance.
3. **Komt eraan** — next 14 days of fixed costs and obligations, with a red row if the forecast dips below zero.
4. **Te controleren** — review queue count (uncategorised / low-confidence / possible split).
5. **Potjes achterstand** — only if at least one potje is behind.
6. **Recente transacties** — last 5.

Sections 4–6 collapse when empty. The screen must be useful with zero transactions (empty state teaches, does not decorate).

## 5. Navigation invariants

- Tapping the app icon always lands on Vandaag with fresh data (background refresh, stale-while-revalidate).
- Any number shown anywhere is tappable and leads to the transactions that produced it. No dead ends.
- Back always returns to where the user came from; modals never stack more than 2 deep.
- The FAB is available on every tab.
