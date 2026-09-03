# 14 — API contracts

Two surfaces: **PostgREST** (direct table/RPC access, RLS-enforced) and **Edge Functions** (anything involving a secret or an external call).

Rule of thumb: if it needs a key, it is an Edge Function. If it is a query, it is PostgREST or an RPC.

---

## 1. Conventions

- Base: `https://<project>.supabase.co/functions/v1/`
- Auth: `Authorization: Bearer <supabase access token>` on every call. Functions reject anonymous requests except `bank/institutions` (still requires auth, just no household).
- Content type: `application/json`, UTF-8.
- Idempotency: mutating functions accept `Idempotency-Key` and store it in `edge_idempotency(key, response, created_at)` for 24h.
- All request and response bodies are defined as **zod schemas in `packages/shared/contracts/`** and imported by both the app and the function. There is no hand-written type on either side.
- Money in payloads is always integer cents, field name suffixed `_cents`.
- Dates: `YYYY-MM-DD` for business dates, RFC3339 UTC for instants.

---

## 2. Edge Functions

### `POST /bank/institutions`
```ts
Request  = { country: 'NL' }
Response = { institutions: Array<{
  id: string; name: string; logoKey: string;
  supportsAccountTypes: Array<'payment'|'savings'|'card'>;
  noticeKey?: string;          // i18n key, e.g. 'bank.notice.abn_creditcard'
  maxConsentDays: number;
}> }
```
Cached 24h in `institution_cache`, served from cache on provider failure.

### `POST /bank/connect`
```ts
Request  = { institutionId: string; language: 'nl'|'en' }
Response = { connectionId: string; authUrl: string; expiresAt: string }
```
Creates a `bank_connections` row in state `active` with `session_id = null`, mints the signed `state` JWT (15 min), stores the nonce.

### `POST /bank/callback`
```ts
Request  = { state: string; code: string }
Response = { connectionId: string; accounts: Array<{
  id: string; displayName: string; ibanLast4: string;
  accountType: 'payment'|'savings'|'card'|'joint';
  balanceCents: number | null;
}> }
```
Verifies signature, expiry and nonce single-use. Persists `session_id`, `expires_at`, accounts. Enqueues an `initial` sync job. **Never** returns provider tokens.

### `POST /bank/sync`
```ts
Request  = { connectionId: string; mode?: 'incremental'|'deep' }
Response = { jobId: string; state: 'queued'|'running'|'done';
             stats?: { inserted: number; updated: number; accounts: number };
             nextCursor?: string }
```
Rate limit: 1 per connection per 5 min (`429 BANK_RATE_LIMITED` with `Retry-After`).

### `POST /bank/revoke`
```ts
Request  = { connectionId: string; deleteTransactions?: false }
Response = { ok: true }
```
Revokes at the provider, sets state `revoked`. Transactions are kept unless explicitly requested otherwise.

### `POST /enrich`
```ts
Request  = { householdId: string; transactionIds?: string[]; full?: boolean }
Response = { categorised: number; needsReview: number; seriesDetected: number }
```

### `POST /import/parse`
```ts
Request  = { filename: string; contentBase64: string; hint?: 'ing_csv'|'rabobank_csv'|'abnamro_csv'|'bunq_csv'|'sns_csv'|'mt940'|'camt053' }
Response = { detected: string; rows: number; preview: RemoteTransaction[];    // first 10
             mapping?: ColumnMapping; warnings: string[] }
```

### `POST /import/commit`
```ts
Request  = { householdId: string; accountId: string; token: string }   // token from /import/parse
Response = { inserted: number; duplicates: number; skipped: number }
```

### `POST /export`
```ts
Request  = { householdId: string; format: 'csv'|'xlsx'|'json'|'pdf_nibud'; from?: string; to?: string }
Response = { url: string; expiresAt: string }     // signed Storage URL, 1h
```

### `POST /notifications/register`
```ts
Request  = { expoPushToken: string; platform: 'ios'|'android'; locale: string }
Response = { ok: true }
```

### `POST /subscription/sync`
```ts
Request  = { revenueCatCustomerId: string }
Response = { entitlement: 'free'|'plus'|'household'; expiresAt: string | null }
```
Verifies against RevenueCat server-side and writes `entitlements`. The client never decides its own tier.

### `POST /account/delete`
```ts
Request  = { confirm: 'VERWIJDER' }
Response = { ok: true; deletedAt: string }
```
Writes an `audit_log` entry, revokes all bank consents, then hard-deletes. Irreversible; a 7-day grace window is **not** offered (users asked for deletion, they get deletion) — but the app warns clearly before calling.

---

## 3. PostgREST usage

Allowed directly from the app (RLS enforced):
- `select` on `transactions`, `categories`, `budget_periods`, `budget_lines`, `envelopes`, `envelope_contributions`, `recurring_series`, `obligations`, `bank_accounts`, `merchants`, `nibud_reference`
- `insert/update/delete` on `transactions` (manual only — a trigger rejects client writes where `source='bank'`), `budget_lines`, `envelopes`, `rules`, `transaction_splits`, `split_participants`, `tags`
- RPCs listed in `docs/07` §6

Always select explicit columns:
```ts
supabase.from('transactions')
  .select('id,booked_at,direction,amount_cents,description_clean,counterparty_name,category_id,status,merchant_id')
  .eq('household_id', h).order('booked_at', { ascending: false }).range(0, 49);
```

Pagination: keyset on `(booked_at desc, id desc)`, not `offset`, for lists beyond page 2.

---

## 4. Realtime

Subscribe to `postgres_changes` on `transactions` and `bank_connections` filtered by `household_id`. Used to update the UI when a background sync completes. Fallback: poll `sync_jobs` every 5s while a job is running and the app is foregrounded. Realtime is an optimisation, never a correctness requirement.

---

## 5. Error envelope & codes

Every non-2xx response:
```jsonc
{ "error": { "code": "BANK_CONSENT_EXPIRED", "message": "…dev-facing English…", "retryable": false, "meta": {} } }
```

| Code | HTTP | Retryable | i18n key |
|---|---|---|---|
| `AUTH_REQUIRED` | 401 | no | `errors.auth_required` |
| `FORBIDDEN` | 403 | no | `errors.forbidden` |
| `NOT_FOUND` | 404 | no | `errors.not_found` |
| `VALIDATION_FAILED` | 422 | no | `errors.validation` |
| `RATE_LIMITED` | 429 | yes | `errors.rate_limited` |
| `BANK_CONSENT_EXPIRED` | 409 | no | `errors.bank_consent_expired` |
| `BANK_SCA_REQUIRED` | 409 | no | `errors.bank_sca_required` |
| `BANK_UNAVAILABLE` | 503 | yes | `errors.bank_unavailable` |
| `BANK_RATE_LIMITED` | 429 | yes | `errors.bank_rate_limited` |
| `BANK_ACCOUNT_UNSUPPORTED` | 422 | no | `errors.bank_account_unsupported` |
| `IMPORT_UNPARSEABLE` | 422 | no | `errors.import_unparseable` |
| `ENTITLEMENT_REQUIRED` | 402 | no | `errors.entitlement_required` |
| `CONFLICT` | 409 | yes | `errors.conflict` |
| `INTERNAL` | 500 | yes | `errors.internal` |

The client **never** displays `message`; it displays the i18n string for `code`. `message` goes to Sentry only.

---

## 6. Rate limits

| Endpoint | Limit |
|---|---|
| `/bank/sync` | 1 / connection / 5 min; 20 / household / day |
| `/bank/connect` | 10 / user / hour |
| `/import/parse` | 20 / user / hour, 10 MB body |
| `/export` | 5 / user / hour |
| `/enrich` | 5 / household / hour (manual invocation) |
| PostgREST | Supabase defaults; keyset pagination mandatory |

Implemented in `_shared/ratelimit.ts` backed by a `rate_limits(key, window_start, count)` table with an upsert-and-check in one statement.

---

## 7. Versioning

- Contracts are additive. New optional fields are fine; removing or retyping a field requires a new function path (`/bank/sync/v2`).
- The app sends `X-Kwartje-Client: <platform>/<appVersion>/<buildNumber>`.
- A function may return `426 Upgrade Required` with `{ minVersion }` when a client is too old; the app shows a blocking update screen. Use this sparingly — twice a year at most.
