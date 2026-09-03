# 06 — Data model

Conventions: all ids are `uuid` (`gen_random_uuid()`), all money is `bigint` **cents**, all timestamps are `timestamptz` UTC, all *business dates* are `date` interpreted in `Europe/Amsterdam`. Every tenant-owned table carries `household_id` and is protected by RLS.

---

## 1. Entity overview

```
auth.users ──1:1── profiles
                      │
                      └──n:m── households ──< household_members
                                    │
     ┌──────────────────────────────┼───────────────────────────────┐
     │                              │                               │
bank_connections            budget_periods                     categories
     │                              │                          (+ category_groups enum)
bank_accounts ──< balances    budget_lines                          │
     │                              │                               │
transactions >──────────────────────┴───────────────────────────────┘
     │  │  │
     │  │  └──< transaction_splits ──> split_participants
     │  └─────< attachments
     └────────> merchants
                recurring_series ──< series_occurrences
                envelopes ──< envelope_contributions
                obligations ──< obligation_instalments
                goals
                rules
                benefits            (toeslagen)
                income_events       (salary, vakantiegeld, 13e maand)
                notifications
                audit_log
```

---

## 2. Core enums

```sql
create type category_group as enum ('vaste_lasten','reserveringen','huishoudelijk','vrij_besteedbaar','inkomen','overboeking');
create type txn_direction  as enum ('in','out');
create type txn_status     as enum ('booked','pending');
create type txn_source     as enum ('bank','manual','import','split');
create type scope_kind     as enum ('personal','household','business');
create type period_kind    as enum ('calendar_month','custom_month','four_weeks');
create type rollover_mode  as enum ('none','carry_surplus','carry_all');
create type envelope_kind  as enum ('reservering','goal','tax','buffer');
create type connection_state as enum ('active','expiring','expired','error','revoked');
create type cadence        as enum ('weekly','four_weekly','monthly','bimonthly','quarterly','半yearly','yearly','irregular');
```
> Fix the typo when implementing: `half_yearly`.

---

## 3. Tenancy: households and scope

- A `household` is the tenant boundary. Every user has at least one (created on signup, named "Mijn huishouden").
- `household_members(household_id, user_id, role, income_share_bps, joined_at)`. `role ∈ {owner, member}`.
- **Scope** on transactions, budgets, envelopes and accounts:
  - `personal` — visible only to the owning `user_id`, even inside a shared household.
  - `household` — visible to all members.
  - `business` — visible to owner, excluded from household budgets (ZZP, v2).
- RLS enforces: `household_id in (my households)` **and** (`scope <> 'personal'` **or** `owner_user_id = auth.uid()`).
- `income_share_bps` (basis points) drives income-ratio splitting (P2). Sum across members should be 10000; the app does not enforce it, the split UI normalises.

**Invariant I-1**: a row may never change `household_id` after creation. Moving data between households is an export/import operation.

---

## 4. Money in / money out

### `bank_connections`
| Field | Type | Notes |
|---|---|---|
| id | uuid pk | |
| household_id | uuid | |
| owner_user_id | uuid | who authorised the consent |
| provider | text | `enable_banking` (only value in v1) |
| institution_id | text | provider's ASPSP id |
| institution_name | text | display |
| session_id | text | provider session/consent reference |
| state | connection_state | |
| consented_at | timestamptz | |
| expires_at | timestamptz | **90 days** under PSD2 |
| last_sync_at | timestamptz | |
| last_error_code | text | |
| psu_ip_hash | text | for provider audit, hashed |

**Invariant I-2**: no tokens or credentials are stored here. The provider session reference is only usable together with the server-held private key.

### `bank_accounts`
`id, connection_id, household_id, owner_user_id, scope, iban_hash, iban_last4, display_name, official_name, account_type ('payment'|'savings'|'card'|'joint'), currency ('EUR'), include_in_budget bool, history_available_from date, archived_at`

**Invariant I-3**: the full IBAN is **never** stored in plaintext. Store `iban_last4` for display and `iban_hash = sha256(iban || pepper)` for matching. The pepper lives in Supabase Vault.

### `balances`
`id, account_id, as_of date, kind ('booked'|'available'), amount_cents, created_at` — one row per account per day per kind. Upsert on `(account_id, as_of, kind)`.

### `transactions`
| Field | Type | Notes |
|---|---|---|
| id | uuid pk | |
| household_id, owner_user_id, scope | | tenancy |
| account_id | uuid null | null for cash/manual-without-account |
| external_id | text null | bank's transaction id |
| dedupe_hash | text | see §5 |
| booked_at | date | business date, Europe/Amsterdam |
| value_at | date null | valuta date |
| created_at | timestamptz | |
| direction | txn_direction | |
| amount_cents | bigint | **always positive**; direction carries the sign |
| currency | text | `EUR` |
| original_amount_cents, original_currency | | for FX |
| description_raw | text | untouched bank text |
| description_clean | text | normalised (see `docs/09` §4) |
| counterparty_name | text null | |
| counterparty_iban_hash | text null | |
| merchant_id | uuid null | |
| category_id | uuid null | |
| category_source | text | `rule` / `merchant` / `series` / `heuristic` / `user` / `unset` |
| category_confidence | numeric(3,2) | 0..1 |
| series_id | uuid null | recurring series membership |
| status | txn_status | |
| source | txn_source | |
| is_transfer | bool | internal move between own accounts |
| transfer_pair_id | uuid null | |
| is_excluded | bool | excluded from budgets/reports |
| is_reimbursable | bool | "voorgeschoten" |
| note | text null | |
| tags | text[] | |
| updated_at | timestamptz | |

**Invariant I-4**: `amount_cents > 0` always. Never store negative amounts.
**Invariant I-5**: a transaction with `is_transfer = true` is excluded from every income/expense aggregate, but still affects balances.
**Invariant I-6**: `category_source = 'user'` is never overwritten by any automatic process.

### `transaction_splits`
`id, transaction_id, category_id, amount_cents, note` — sum of splits must equal the parent amount.
**Invariant I-7**: if splits exist, the parent's `category_id` is ignored by all aggregates; only splits count.

### `split_participants`
`id, transaction_id, name, contact_ref null, owed_cents, settled_at null, settle_method ('tikkie'|'wero'|'iban'|'cash'|'other')` — for F-21.

---

## 5. Deduplication

`dedupe_hash = sha256(account_id || booked_at || amount_cents || direction || normalize(description_raw)[0..64])`

Rules:
- Bank sync upserts on `(account_id, external_id)` when `external_id` exists, else on `dedupe_hash`.
- A `pending` transaction that later appears as `booked` with the same amount and counterparty within ±5 days is **merged**, preserving user edits (category, note, tags, splits).
- Manual entries matching a synced transaction (same amount, ±3 days, no `external_id`) trigger a merge prompt; auto-merge only if the user opted in.

**Invariant I-8**: merging never loses a user-set category, note, tag or split.

---

## 6. Categories

- `category_groups` is the fixed enum in §2 — **not** a table users can extend.
- `categories(id, household_id null, group category_group, key text, name_nl, name_en, icon, color, parent_id null, is_system bool, sort_order, archived_at)`.
- System categories have `household_id is null` and are visible to everyone. Users can hide them and create their own (household-scoped).
- Two levels maximum: group → category → optional subcategory.

Seeded system categories (key → group):

**vaste_lasten**: `huur`, `hypotheek`, `energie`, `water`, `gemeentebelasting`, `waterschapsbelasting`, `zorgverzekering`, `overige_verzekeringen`, `internet_tv`, `mobiel`, `abonnementen`, `kinderopvang`, `ov_abonnement`, `aflossingen`, `alimentatie`

**reserveringen**: `kleding`, `inventaris_onderhoud`, `vakantie`, `zorgkosten_eigen_risico`, `contributies`, `cadeaus_feestdagen`, `auto_onderhoud_apk`, `huisdier_zorg`, `studie`

**huishoudelijk**: `boodschappen`, `schoonmaak_was`, `persoonlijke_verzorging`, `huisdieren`, `uit_eten_bezorgen`, `vervoer_brandstof`, `openbaar_vervoer`, `vrije_tijd`, `sport`, `medisch_klein`

**vrij_besteedbaar**: `sparen`, `beleggen`, `uitgaan`, `hobby`, `overig`

**inkomen**: `salaris`, `vakantiegeld`, `dertiende_maand`, `toeslagen`, `kinderbijslag`, `uitkering`, `zzp_omzet`, `rente`, `teruggave_belasting`, `overig_inkomen`

**overboeking**: `interne_overboeking`, `sparen_overboeking`

**Invariant I-9**: every category belongs to exactly one group and a transaction's bucket is derived from its category's group. Buckets are never set directly.

---

## 7. Budget

### `budget_periods`
`id, household_id, kind period_kind, starts_on date, ends_on date, label text, is_current bool`
- `calendar_month`: 1st → last day.
- `custom_month`: anchored on `households.period_anchor_day` (e.g. 24 → 24 Mar to 23 Apr).
- `four_weeks`: 28-day periods anchored on `households.period_anchor_date`.

**Invariant I-10**: periods for a household never overlap and never leave gaps.

### `budget_lines`
`id, period_id, household_id, category_id, scope, planned_cents, rollover_mode, carried_in_cents, note`
- `carried_in_cents` is computed at period roll and then frozen.

### `envelopes` (potjes)
`id, household_id, owner_user_id, scope, kind envelope_kind, name, category_id null, target_cents, target_date date null, saved_cents, monthly_contribution_cents null, auto_contribute bool, linked_account_id null, priority int, archived_at`
- `monthly_contribution_cents` is derived when null: `ceil((target_cents - saved_cents) / months_remaining)`.

### `envelope_contributions`
`id, envelope_id, period_id, amount_cents, kind ('planned'|'actual'|'withdrawal'), transaction_id null, created_at`

**Invariant I-11**: `saved_cents = sum(contributions.amount where kind in ('actual')) - sum(withdrawals)`. It is a materialised value refreshed by trigger, never edited directly.

---

## 8. Recurring, obligations, income

### `recurring_series`
`id, household_id, scope, merchant_id null, counterparty_iban_hash null, name, category_id, cadence, typical_amount_cents, amount_tolerance_bps, next_expected_on date, last_seen_on date, confidence numeric, is_subscription bool, contract_started_on date null, cancellable_from date null, cancel_url text null, status ('active'|'paused'|'ended'), created_from ('detected'|'manual')`

- `cancellable_from` implements Wet Van Dam: `contract_started_on + 1 year` for consumer subscriptions, else null. Displayed as information, never as legal advice.

### `series_occurrences`
`id, series_id, expected_on date, expected_amount_cents, transaction_id null, status ('expected'|'matched'|'missed'|'skipped')`

### `obligations`
Annual/irregular bills that are not simple recurring debits: gemeentebelasting, MRB, jaarafrekening, verzekeringspremie.
`id, household_id, scope, template_key null, name, category_id, expected_amount_cents, expected_on date, certainty ('estimated'|'confirmed'), envelope_id null, instalment_count int null, notes`

### `obligation_instalments`
`id, obligation_id, due_on date, amount_cents, transaction_id null, status`

### `income_events`
`id, household_id, owner_user_id, scope, kind ('salary'|'vakantiegeld'|'dertiende_maand'|'benefit'|'other'), name, expected_on date, expected_amount_cents, cadence, actual_transaction_id null`

### `benefits` (toeslagen)
`id, household_id, owner_user_id, type ('zorgtoeslag'|'huurtoeslag'|'kindgebonden_budget'|'kinderopvangtoeslag'), monthly_amount_cents, valid_from date, valid_to date null, reference_income_cents null, last_confirmed_on date`
- Paid on the 20th–22nd for the following month → generates `income_events`.
- Changing `reference_income_cents` raises a `benefit_review` notification: *"Je inkomen is gewijzigd. Geef dit door aan de Belastingdienst om terugvordering te voorkomen."* Informational, with a link. Never a calculation of what they should receive.

---

## 9. Supporting

- `merchants(id, household_id null, key, display_name, logo_asset, default_category_id, match_patterns text[], is_system)`
- `rules(id, household_id, owner_user_id, scope, priority, conditions jsonb, actions jsonb, is_enabled, created_from ('user'|'learned'), hit_count, last_hit_at)` — schema for `conditions`/`actions` in `docs/09` §3.
- `goals` — modelled as `envelopes` with `kind='goal'`. No separate table.
- `attachments(id, transaction_id, household_id, storage_path, mime, bytes, ocr_json jsonb null)`
- `notifications(id, household_id, user_id, type, payload jsonb, scheduled_for, sent_at, read_at, dismissed_at)`
- `audit_log(id, household_id, actor_user_id, action, entity, entity_id, before jsonb, after jsonb, at)` — write on: connection created/removed, export, delete request, household member change, budget plan change.
- `nibud_reference(id, household_type, income_band, category_key, amount_cents, source_year, source_note)` — local, editable, attributed (see `docs/16` §8).

---

## 10. Local (device) mirror

The device SQLite mirror stores a subset for offline use:
`transactions` (last 24 months), `categories`, `budget_periods`, `budget_lines`, `envelopes`, `recurring_series`, `merchants`, `accounts`, plus an `outbox` table.

`outbox(id, entity, entity_id, op ('insert'|'update'|'delete'), payload jsonb, created_at, attempts, last_error)`

Sync protocol: `docs/13` §6. Conflict rule: **server wins for bank-derived fields; client wins for user-set fields** (`category_id` when `category_source='user'`, `note`, `tags`, splits), resolved field-by-field with `updated_at` as tiebreaker.

---

## 11. Invariant checklist (test these)

| # | Invariant | Test |
|---|---|---|
| I-1 | `household_id` immutable | pgTAP trigger test |
| I-2 | No credentials in `bank_connections` | schema review + lint |
| I-3 | No plaintext IBAN anywhere | grep test in CI over migrations |
| I-4 | `amount_cents > 0` | check constraint |
| I-5 | Transfers excluded from aggregates | unit test on aggregate views |
| I-6 | User category never overwritten | unit + integration test |
| I-7 | Splits override parent category | unit test |
| I-8 | Merge preserves user data | unit test |
| I-9 | Bucket derived from category group | type-level + db view |
| I-10 | Periods contiguous, non-overlapping | pgTAP exclusion constraint |
| I-11 | `saved_cents` derived | trigger + pgTAP |
