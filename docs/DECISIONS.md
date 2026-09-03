# Decision log

Append an entry whenever you deviate from a spec, resolve an ambiguity, or pick between two defensible options. Newest last.

Format:

```
## YYYY-MM-DD — <short topic>
**Context**: what forced a choice.
**Options**: A / B / C, with the trade-off in one line each.
**Decision**: what you did.
**Consequence**: what this means later; what would make us revisit.
**Specs touched**: docs/xx §y
```

---

## 2026-09-03 — Aggregator choice
**Context**: The spec needed a concrete PSD2 provider for Dutch banks.
**Options**: GoCardless Bank Account Data (closed to new signups, being wound down) / Enable Banking (EU-native, free restricted production, all major NL ASPSPs) / Tink (mature, enterprise pricing) / TrueLayer, Yapily, Salt Edge.
**Decision**: Enable Banking as primary, behind the `AggregatorAdapter` interface so any of the others can replace it.
**Consequence**: Provider-specific code is confined to `supabase/functions/_shared/aggregator/`. Revisit if NL coverage or reliability disappoints in the M3 gate.
**Specs touched**: docs/08 §1, §3

## 2026-09-03 — Budget model
**Context**: Envelope budgeting (YNAB) vs the Nibud four-bucket model.
**Options**: Generic user-defined envelopes / fixed Nibud groups / both.
**Decision**: Fixed Nibud groups as the structural spine, with envelopes ("potjes") existing *inside* the reserveringen bucket.
**Consequence**: `category_group` is an enum, not a table. This is the product's differentiator and must not be genericised for an international market without a deliberate re-spec.
**Specs touched**: docs/02 §4, docs/06 §6, docs/10 §2
