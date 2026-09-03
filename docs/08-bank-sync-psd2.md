# 08 — Bank sync (PSD2 / AIS)

## 1. Provider decision

**Primary: Enable Banking.** Reasons: EU/EEA-native coverage including all major Dutch ASPSPs (ING, Rabobank, ABN AMRO, de Volksbank brands, Triodos, Van Lanschot, bunq, Knab, Revolut, N26), a *free restricted-production* tier that returns **real** production data for accounts you link yourself (so the whole engine can be built and dogfooded before any contract), JWT/private-key auth that fits an Edge Function, and a clean AIS-only surface.

**Explicitly rejected**: GoCardless Bank Account Data (ex-Nordigen) — closed to new signups and being wound down; not an option for a new project.

**Fallbacks, in order**: Tink → TrueLayer → Yapily → Salt Edge. All are reachable behind the adapter in §3 with no changes above it.

**Hard rule**: the aggregator is called **only** from Supabase Edge Functions. The app never holds a provider key, never sees a provider token, and never calls the provider directly.

## 2. Regulatory posture

- Reading accounts is a regulated AIS activity. Kwartje operates **under the aggregator's AISP licence** (technical service provider / registered agent model). This must be confirmed in writing by counsel before public launch — see `docs/16` §7. Until then: closed beta with own/consenting testers only.
- PSD2 consent lifetime is **90 days**, then fresh SCA. PSD3/PSR may relax this from ~2028; design for 90 days.
- We never request PIS (payment initiation) scopes. Read-only, always. Say so in the UI.

## 3. The adapter interface

Everything provider-specific lives behind this. Implemented in `supabase/functions/_shared/aggregator/`.

```ts
export interface AggregatorAdapter {
  readonly id: 'enable_banking' | 'tink' | 'truelayer';

  listInstitutions(country: 'NL'): Promise<Institution[]>;

  /** Start consent. Returns the URL to send the user to (bank redirect / app switch). */
  startAuth(input: {
    institutionId: string;
    redirectUri: string;
    state: string;            // opaque, signed by us
    psuIpAddress?: string;
    validUntil: string;       // ISO, max provider limit (90d)
    language: 'nl' | 'en';
  }): Promise<{ authUrl: string; providerRef: string }>;

  /** Exchange the callback code for a durable session reference. */
  completeAuth(input: { code: string; providerRef: string }): Promise<{
    sessionId: string;
    expiresAt: string;
    accounts: RemoteAccount[];
  }>;

  listAccounts(sessionId: string): Promise<RemoteAccount[]>;

  getBalances(sessionId: string, accountRef: string): Promise<RemoteBalance[]>;

  /** Paginated, date-windowed. Must be resumable via continuationKey. */
  listTransactions(input: {
    sessionId: string;
    accountRef: string;
    from: string;             // ISO date
    to: string;
    continuationKey?: string;
  }): Promise<{ items: RemoteTransaction[]; continuationKey?: string }>;

  revoke(sessionId: string): Promise<void>;
}

export type RemoteTransaction = {
  externalId?: string;
  bookingDate?: string;       // ISO date
  valueDate?: string;
  amount: string;             // decimal string, signed
  currency: string;
  status: 'booked' | 'pending';
  creditorName?: string;
  debtorName?: string;
  creditorIban?: string;
  debtorIban?: string;
  remittanceInformation?: string[];
  endToEndId?: string;
  proprietaryBankTransactionCode?: string;
  raw: unknown;               // kept for debugging, never persisted verbatim
};
```

**Rule**: no code outside `_shared/aggregator/` may import provider SDK types.

## 4. Data flow

```
App                     Edge Function                  Aggregator            Bank
 │  POST /bank/institutions ─────────►                       │
 │  ◄──── list (cached 24h) ─────────                        │
 │  POST /bank/connect {institutionId} ─►                     │
 │                        │ startAuth ─────────────►          │
 │  ◄──── {authUrl, connectionId} ─────                       │
 │  open authUrl (in-app browser / app switch) ─────────────────────────►
 │                                                        SCA (biometrics/PIN)
 │  ◄──── redirect kwartje://bank/callback?state&code ──────────────────
 │  POST /bank/callback {state, code} ─►                      │
 │                        │ completeAuth ───────────►         │
 │                        │ persist connection+accounts       │
 │  ◄──── {connectionId, accounts[]} ──                       │
 │  POST /bank/sync {connectionId} ────►                      │
 │                        │ listTransactions (paged) ────────►│
 │                        │ normalise → dedupe → upsert       │
 │                        │ categorise → detect series        │
 │  ◄──── {inserted, updated, nextCursor} ─                   │
```

## 5. Redirect & deep-link handling

- Redirect URI registered with the provider: `https://kwartje.nl/bank/callback` (universal link) which forwards to `kwartje://bank/callback`. Never use a raw custom scheme as the registered URI — several banks reject non-HTTPS redirects.
- `state` is a JWT signed by the Edge Function containing `{connectionId, householdId, userId, nonce, exp: now+15m}`. On callback the function verifies signature, expiry and single use (nonce stored in `bank_auth_nonces`, deleted on use).
- Open the bank in `expo-web-browser` `openAuthSessionAsync` so the app switch and return work on both platforms.
- Van Lanschot has no automatic app switch on mobile — show an instruction line for that institution.
- ING and Rabobank require QR scanning on desktop; irrelevant for mobile but note it in support copy.

## 6. Sync algorithm

```
syncConnection(connectionId, mode: 'initial' | 'incremental' | 'deep'):
  conn = load(connectionId); assertState(conn, 'active' | 'expiring')
  for account in conn.accounts where include_in_budget or always:
     window = mode == 'initial'
          ? [today - 24 months, today]
          : [max(account.last_booked_at - 7d, today - 90d), today]     # overlap for late bookings
     cursor = null
     loop:
        page = adapter.listTransactions({sessionId, accountRef, from, to, cursor})
        rows = page.items.map(normalise)
        upsertBatch(rows)                     # see §7
        cursor = page.continuationKey
        until cursor is null or budgetExceeded
     upsertBalances(adapter.getBalances(...))
     account.last_synced_at = now
  reconcilePending()                          # §7.3
  runCategorisation(newIds)                   # docs/09
  runRecurringDetection(household)            # docs/09 §7
  emitSyncEvent(conn, stats)
```

Scheduling:
- Nightly `sync_all_connections` at 04:00 UTC, jittered by `hashtext(household_id) % 3600` seconds.
- Manual pull-to-refresh: rate-limited to 1 per connection per 5 minutes; returns cached result otherwise.
- On app foreground, if `last_sync_at > 6h`, trigger a background incremental sync.
- `deep` mode is manual only (settings → "Volledig opnieuw ophalen"), used after fixing a categorisation disaster.

Budgets and limits:
- Max 10 pages or 5000 transactions per account per run; continue next run with a stored cursor.
- Edge Function hard timeout: 55s. Long initial syncs are chunked into a queue table `sync_jobs(id, connection_id, account_ref, from, to, cursor, state, attempts)` processed by repeated invocations.

## 7. Normalisation

### 7.1 Field mapping
| Remote | Local |
|---|---|
| `amount` sign | `direction` (`-` → `out`, `+` → `in`), `amount_cents = abs(round(amount*100))` |
| `bookingDate` ?? `valueDate` ?? sync date | `booked_at` (as `Europe/Amsterdam` date) |
| `creditorName` when out, `debtorName` when in | `counterparty_name` |
| corresponding IBAN | `counterparty_iban_hash` (never plaintext) |
| `remittanceInformation.join(' ')` + proprietary text | `description_raw` |
| `status` | `status` |
| `externalId` ?? computed | `external_id` |

### 7.2 Amount parsing
Parse decimal strings with a fixed-point parser, never `parseFloat`:
```ts
const cents = (s: string) => {
  const m = /^(-?)(\d+)(?:[.,](\d{1,2}))?$/.exec(s.trim());
  if (!m) throw new AppError('BANK_AMOUNT_PARSE');
  const [, sign, whole, frac = ''] = m;
  return Number(`${sign}${whole}${frac.padEnd(2, '0')}`);
};
```

### 7.3 Pending reconciliation
- Pending rows are stored with `status='pending'` and are **excluded from budget actuals** but **included in the forecast**.
- On each sync, a pending row with no matching booked row and `booked_at < today - 7d` is deleted.
- A booked row matching a pending row on (account, amount, direction, counterparty, ±5 days) inherits the pending row's user edits and the pending row is deleted.

### 7.4 Internal transfers
Two transactions in the same household, opposite directions, equal amount, within ±2 days, where each counterparty IBAN hash matches one of the user's own accounts → both get `is_transfer = true` and a shared `transfer_pair_id`.

## 8. Consent lifecycle

| State | Meaning | UI |
|---|---|---|
| `active` | > 14 days remaining | Nothing |
| `expiring` | ≤ 14 days remaining | Amber banner on Rekeningen; push at T-14, T-7, T-2 |
| `expired` | past `expires_at` | Red banner everywhere data is stale; "Opnieuw koppelen" CTA; data stays visible with "laatst bijgewerkt op …" |
| `error` | provider/bank error | Show human message + retry; after 3 consecutive failures, notify once |
| `revoked` | user or bank revoked | Offer reconnect or remove |

Renewal is a fresh `startAuth` against the same `institution_id`, reusing the existing `bank_accounts` rows by matching `iban_hash` so history and user edits survive.

**Never** delete transactions when a consent expires.

## 9. Errors

| Code | Cause | User message (nl) | Retry |
|---|---|---|---|
| `BANK_CONSENT_EXPIRED` | 90 days passed | "De koppeling met je bank is verlopen. Koppel opnieuw om je transacties bij te werken." | User action |
| `BANK_SCA_REQUIRED` | Bank wants fresh SCA | "Je bank vraagt om opnieuw in te loggen." | User action |
| `BANK_UNAVAILABLE` | ASPSP 5xx / maintenance | "Je bank is tijdelijk niet bereikbaar. We proberen het vanzelf opnieuw." | Auto, exp. backoff |
| `BANK_RATE_LIMITED` | Provider/ASPSP 429 | (silent) | Auto, backoff + jitter |
| `BANK_ACCOUNT_UNSUPPORTED` | e.g. ABN creditcard | "Dit rekeningtype kan niet worden gekoppeld." | No |
| `BANK_PARTIAL_HISTORY` | Bank limits history | Info line on the account | No |
| `BANK_AMOUNT_PARSE` | Bad payload | (silent, Sentry) | No |

Backoff: 1m, 5m, 15m, 1h, 6h, then daily. Circuit-break a whole institution after 20 consecutive failures across households and show a status banner.

## 10. Fallback: file import (F-07)

When a bank is unsupported, consent is refused, or a user prefers it:
- Named parsers: `ing_csv`, `rabobank_csv`, `abnamro_csv`, `bunq_csv`, `sns_csv`, `mt940`, `camt053`.
- Each parser is a pure function `(text: string) => RemoteTransaction[]` with a fixture test in `docs/19` §4.
- Unknown CSV → column mapper UI (date / amount / description / counterparty / debit-credit indicator), remembered per file signature.
- Imported rows get `source='import'` and go through the identical normalise → dedupe → categorise pipeline.

## 11. Testing the sync engine

- The adapter has a `MockAggregatorAdapter` backed by JSON fixtures in `supabase/functions/_shared/aggregator/__fixtures__/` containing at minimum: one ING, one Rabobank and one bunq account with 400+ realistic Dutch transactions (iDEAL, BEA, SEPA incasso, Tikkie, salaris, toeslag, statiegeld, Wero).
- Contract tests assert every adapter satisfies the interface and normalises the fixtures identically.
- Integration test: initial sync → 400 rows; re-run → 0 inserts, 0 duplicates; pending→booked → merge preserves a user category.
