# 09 — Categorisation & enrichment engine

Runs server-side (Edge Function `enrich`) after every sync and import, and client-side optimistically for manual entries using the same pure functions from `packages/shared/enrich/`.

Target: **≥88%** of transactions correctly categorised without user intervention (`docs/01` §6).

---

## 1. Pipeline

Executed in order; **first match wins**, except stage 0 which is absolute.

| Stage | Name | Confidence | Sets `category_source` |
|---|---|---|---|
| 0 | **User lock** — `category_source = 'user'` already | 1.00 | unchanged (never overwritten) |
| 1 | **Explicit rules** — user-authored, by priority | 0.99 | `rule` |
| 2 | **Learned rules** — auto-created from ≥2 corrections | 0.95 | `rule` |
| 3 | **Counterparty IBAN match** — hash seen before with a stable category | 0.92 | `merchant` |
| 4 | **Recurring series match** — belongs to a confirmed series | 0.90 | `series` |
| 5 | **Merchant dictionary** — normalised name matches a seeded merchant | 0.85 | `merchant` |
| 6 | **Descriptor heuristics** — token/regex table (§5) | 0.60–0.80 | `heuristic` |
| 7 | **Amount+cadence heuristics** — e.g. €0.15/€0.25 credit at a supermarket | 0.55 | `heuristic` |
| 8 | **Fallback** — `overig` in the direction-appropriate group | 0.20 | `unset` |

Anything with confidence `< 0.70` lands in the **Te controleren** review queue on Vandaag.

---

## 2. Normalisation of the description (`description_clean`)

Applied before every matching stage. Pure, deterministic, unit-tested.

```
1. Uppercase → then casefold for matching, keep a title-cased copy for display.
2. Strip known prefixes:
   ^(BEA|GEA|SEPA|BETAALAUTOMAAT|IDEAL|WERO)[,: ]*
   ^(SEPA\s+)?(Incasso|Overboeking|iDEAL|Periodieke overb\.?)\b
   ^/TRTP/.*?/                      (structured tags)
3. Remove noise tokens:
   PAS\d{2,4}, NR:\S+, KENMERK:\S+, MACHTIGING:\S+, IBAN:\s*\S+, BIC:\s*\S+,
   \b\d{2}[-/]\d{2}[-/]\d{2,4}\b, \b\d{2}:\d{2}\b, ^\d{6,}$
4. Extract, then remove, structured fields:
   Naam:\s*(?<name>.+?)(?=\s+(Omschrijving|Kenmerk|IBAN|BIC|$))
   Omschrijving:\s*(?<memo>.+)$
   Incassant(?:ID)?:\s*(?<creditor>\S+)
5. Collapse whitespace, trim, drop trailing punctuation.
6. Result: description_clean = name || memo || remainder, max 120 chars.
```

Worked examples (must be test cases):

| Raw | `description_clean` | `counterparty_name` |
|---|---|---|
| `BEA, Betaalpas ALBERT HEIJN 1234 DEN HAAG,PAS402` | `ALBERT HEIJN 1234 DEN HAAG` | `Albert Heijn` |
| `SEPA iDEAL IBAN: NL12INGB0001234567 BIC: INGBNL2A Naam: Bol.com b.v. Omschrijving: 3012345678` | `Bol.com b.v. 3012345678` | `bol` |
| `SEPA Incasso algemeen doorlopend Incassant: NL42ZZZ33099220 Naam: Zilveren Kruis Machtiging: 123` | `Zilveren Kruis` | `Zilveren Kruis` |
| `/TRTP/SEPA OVERBOEKING/IBAN/NL91ABNA.../NAME/Belastingdienst Toeslagen/REMI/ZORGTOESLAG MAART` | `Belastingdienst Toeslagen ZORGTOESLAG MAART` | `Belastingdienst/Toeslagen` |
| `Tikkie ID 1234 Fleur - pizza vrijdag` | `Fleur - pizza vrijdag` | `Tikkie` |

---

## 3. Rules schema

```jsonc
// rules.conditions
{
  "all": [                                  // "all" | "any"
    { "field": "description_clean", "op": "contains",  "value": "basic-fit" },
    { "field": "amount_cents",      "op": "between",   "value": [2000, 3000] },
    { "field": "direction",         "op": "eq",        "value": "out" },
    { "field": "counterparty_iban_hash", "op": "eq",   "value": "…" },
    { "field": "account_id",        "op": "in",        "value": ["…"] },
    { "field": "booked_at",         "op": "day_of_month_between", "value": [24, 31] }
  ]
}

// rules.actions
{
  "set_category_id": "…",
  "set_tags_add": ["sport"],
  "set_scope": "personal",
  "set_excluded": false,
  "set_series_id": null,
  "stop": true            // stop the pipeline (default true)
}
```

Operators: `contains`, `not_contains`, `starts_with`, `ends_with`, `regex`, `eq`, `neq`, `in`, `between`, `gt`, `lt`, `day_of_month_between`.
Matching is diacritic- and case-insensitive. Regex is executed with a 10ms timeout guard; a rule that times out is disabled and reported.

Priority: lower number first. Learned rules start at priority 500, user rules at 100.

---

## 4. Learning from corrections

```
onUserRecategorise(txn, newCategory):
  set category_id, category_source='user', confidence=1.0
  key = merchant_id ?? counterparty_iban_hash ?? normalizedMerchantToken(description_clean)
  corrections[key][newCategory] += 1
  if corrections[key][newCategory] == 1:
      offer inline: "Altijd '<categorie>' voor <merchant>?"  → creates rule immediately if accepted
  if corrections[key][newCategory] >= 2 and no rule exists:
      create learned rule silently, notify with an undoable toast
  retro-apply: ask "Ook toepassen op 23 eerdere transacties?" (never automatic)
```

A learned rule is deleted automatically if the user contradicts it twice.

---

## 5. Descriptor heuristics (stage 6)

Table lives in `packages/shared/enrich/heuristics.ts`. Format: `[pattern, categoryKey, confidence]`.

### 5.1 Income
```
/\b(salaris|loon|periode\s*\d+|maandsalaris)\b/i         → salaris              0.80
/vakantiegeld|vakantietoeslag/i                          → vakantiegeld         0.85
/dertiende maand|13e maand|eindejaarsuitkering/i         → dertiende_maand      0.85
/belastingdienst.*toeslag|toeslagen/i                    → toeslagen            0.85
/\bSVB\b|kinderbijslag/i                                 → kinderbijslag        0.85
/\bUWV\b|uitkering/i                                     → uitkering            0.80
/teruggaaf|voorlopige aanslag/i                          → teruggave_belasting  0.75
```

### 5.2 Fixed costs
```
/huur|woningstichting|woningcorporatie|vestia|ymere/i    → huur                 0.75
/hypotheek/i                                             → hypotheek            0.85
/eneco|vattenfall|essent|greenchoice|budget energie|vandebron|energiedirect/i → energie 0.85
/vitens|evides|waternet|brabant water|pwn|dunea|oasen/i  → water                0.85
/gemeente\s+\w+|belastingsamenwerking|svhw|cocensus|gbl/i→ gemeentebelasting    0.75
/waterschap|hoogheemraadschap/i                          → waterschapsbelasting 0.85
/zilveren kruis|\bvgz\b|\bcz\b|menzis|\bdsw\b|onvz|unive|zorgverzekeraar/i → zorgverzekering 0.85
/\bkpn\b|odido|vodafone|ziggo|simyo|tele2|t-mobile|lebara/i → internet_tv / mobiel 0.70
/netflix|spotify|videoland|disney\+|hbo max|npo plus|apple\.com\/bill|google one|icloud/i → abonnementen 0.85
/basic-?fit|sportcity|fit for free|anytime fitness/i     → abonnementen         0.80
/kinderopvang|kdv |bso |partou|kindergarden/i            → kinderopvang         0.80
```

### 5.3 Household
```
/albert heijn|\bah to go\b|\bah\b(?!\s*hoy)|jumbo|lidl|aldi|\bplus\b|dirk|coop|spar|picnic|ekoplaza|vomar|hoogvliet|nettorama|poiesz/i → boodschappen 0.90
/etos|kruidvat|trekpleister|douglas|ici paris/i          → persoonlijke_verzorging 0.80
/action|hema|blokker|xenos|ikea|praxis|gamma|karwei|hornbach/i → inventaris_onderhoud 0.70
/thuisbezorgd|uber eats|dominos|new york pizza|flink|crisp|deliveroo/i → uit_eten_bezorgen 0.85
/\bns\b|ns-groep|ovpay|ov-chipkaart|gvb|\bret\b|\bhtm\b|arriva|connexxion|9292/i → openbaar_vervoer 0.85
/shell|\bbp\b|esso|tango|tinq|fastned|allego|shell recharge|total ?energies/i → vervoer_brandstof 0.85
/q-?park|interparking|parkeer|pargo|easypark/i           → vervoer_brandstof     0.70
/swapfiets|felyx|check |greenwheels|mywheels/i           → openbaar_vervoer      0.70
```

### 5.4 Special-case rules

**Statiegeld (F-30)**: an `in` transaction at a known supermarket merchant with `amount_cents` a multiple of 15 or 25 and `< 2500` → category `boodschappen`, `direction` kept as `in`, tagged `statiegeld`, and netted in reports rather than counted as income.

**Tikkie / betaalverzoek (F-21)**:
- `out` + descriptor matches `/tikkie|betaalverzoek|wero/i` → do **not** guess a category; flag `needs_review` with a "Was dit voor meerdere mensen?" prompt.
- `in` + same descriptor family + an open `split_participants` row within ±30 days and equal amount → auto-settle that participant.

**Wero migration**: treat `wero` descriptors as equivalent to `ideal` for merchant extraction. Both feed the same extraction path. Add a regression test with a Wero-formatted descriptor.

**Belastingdienst disambiguation**: `Belastingdienst` alone → could be income (teruggave) or expense (aanslag). Use `direction` plus keywords `TOESLAG`, `AANSLAG`, `MOTORRIJTUIGENBELASTING`, `INKOMSTENBELASTING`, `OMZETBELASTING`.

**CJIB** → `overig` in `vrij_besteedbaar`, tagged `boete`. Never joke about it in copy.

---

## 6. Merchant dictionary

`merchants` table seeded from `supabase/seed/nl_merchants.sql`. Each row:

```sql
insert into merchants (key, display_name, match_patterns, default_category_id, is_system) values
('albert_heijn', 'Albert Heijn',
 array['albert heijn','ah to go','ah togo','albertheijn','ah bezorgservice'],
 (select id from categories where key='boodschappen'), true);
```

Matching: normalised description is tested against each pattern with word-boundary containment; longest pattern wins. Ambiguous two-letter tokens (`AH`, `NS`, `BP`, `CZ`) require a word boundary **and** a supporting signal (amount range, IBAN hash, or another token).

Logos: bundled local assets in `assets/merchants/`, 1x/2x/3x, greyscale fallback with the merchant's initial. **No network call to any logo service** — that would leak spending data to a third party.

Minimum seed size before launch: **250 Dutch merchants** covering ≥80% of typical consumer transaction volume.

---

## 7. Recurring series detection (F-45)

```
detectSeries(household):
  groups = transactions
     .filter(out, not transfer, last 15 months)
     .groupBy(counterparty_iban_hash ?? merchant_id ?? token(description_clean))

  for g in groups where g.length >= 3:
     gaps = diffDays(sortedDates)
     cadence = classify(median(gaps))            # 7±2, 28±3, 30±4, 60±6, 91±8, 182±12, 365±20
     if stddev(gaps) > tolerance(cadence): continue
     amounts = g.map(amount)
     if spread(amounts) > 10% and cadence != 'irregular': mark variable_amount
     confidence = f(count, gapConsistency, amountConsistency)
     upsert recurring_series(...)
     next_expected_on = last_seen_on + cadence
```

- Series with `confidence >= 0.8` are created silently; `0.6–0.8` are proposed to the user in Abonnementen with a confirm/ignore action.
- `is_subscription = true` when the merchant is in the subscription merchant set **or** cadence is monthly/yearly with a stable amount and a media/gym/software category.
- `cancellable_from` = `contract_started_on + 1 year` when `is_subscription` and the user confirmed a contract start (Wet Van Dam). Copy: *"Waarschijnlijk maandelijks opzegbaar vanaf 3 april 2027."* — always "waarschijnlijk", never a legal claim.
- A missed occurrence (expected date + 5 days, nothing matched) marks the occurrence `missed` and may trigger a notification (`docs/17` §2, opt-in).
- **Price-increase detection**: a matched occurrence >8% above the trailing median raises `subscription_price_up`.

---

## 8. Performance budget

| Operation | Budget |
|---|---|
| Enrich 1000 transactions server-side | < 3 s |
| Enrich 1 transaction client-side (manual add) | < 5 ms |
| Rule evaluation, 200 rules × 1000 txns | < 500 ms |
| Series detection, 15 months, 5000 txns | < 2 s |

Rules and merchant patterns are compiled once per invocation into a single pre-indexed structure (token → candidate rules), not evaluated pairwise.

---

## 9. Quality measurement

- Ship a labelled fixture set of **500 anonymised Dutch transactions** (`packages/shared/enrich/__fixtures__/labelled.json`) with expected categories.
- CI runs the pipeline over it and fails if accuracy drops below **88%** or if any previously-correct case regresses.
- In production, track `corrections_within_14d / auto_categorised` per category as the live accuracy metric (aggregate counts only — never the transaction content).
