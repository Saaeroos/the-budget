# 16 — Security, privacy & AVG

Financial transaction data is among the most revealing data a person has. Treat every decision here as a launch blocker, not a hardening task for later.

---

## 1. Data classification

| Class | Examples | Rules |
|---|---|---|
| **C3 — Highly sensitive** | transaction descriptions, counterparty names, amounts, balances, IBANs | Never logged, never in analytics, never in Sentry, never leaves the EU, encrypted at rest and in transit |
| **C2 — Personal** | email, display name, household composition, push token | Minimised, deletable, not shared with third parties beyond processors |
| **C1 — Operational** | error codes, timings, feature flags, aggregate counts | May go to Sentry/PostHog (EU) without identifiers beyond a pseudonymous id |
| **C0 — Public** | app version, institution list | Free |

**Rule**: if you cannot classify a field, it is C3.

---

## 2. Storage & residency

- Supabase project region `eu-central-1` (Frankfurt). Storage, database, Edge Functions, and backups all in the EU.
- Sentry: EU-hosted DSN (`*.de.sentry.io`), `sendDefaultPii: false`, `beforeSend` scrubber (see `docs/13` §8).
- Analytics: PostHog EU (`eu.posthog.com`) or Aptabase EU. **Events only** — event names and non-financial properties. Never an amount, never a merchant, never a category name that reveals health (e.g. never send `category=medisch`).
- No Firebase, no Google Analytics, no Meta SDK, no attribution SDK, no ad SDK. Ever.
- Push notifications go through Expo's push service; **notification bodies must never contain an amount or merchant** when the device is locked — use `Je hebt een melding van Kwartje` as the locked-screen fallback and reveal detail only in-app (`docs/17` §5).

---

## 3. Cryptography & key handling

| Concern | Approach |
|---|---|
| Transport | TLS 1.3 only. Certificate pinning is **not** used (breaks with Supabase cert rotation); rely on ATS/network security config with `cleartextTrafficPermitted=false` |
| At rest (server) | Postgres disk encryption + RLS. Aggregator private key in **Supabase Vault**, never in an env var visible to logs |
| IBAN | Stored as `sha256(iban || pepper)` + `last4`. Pepper in Vault, rotatable with a re-hash migration |
| Session tokens | `expo-secure-store` (Keychain / Keystore), `WHEN_UNLOCKED_THIS_DEVICE_ONLY` |
| Local database | `expo-sqlite` file inside the app sandbox. Optional SQLCipher-style encryption is **not** available cross-platform in Expo Go builds; instead: (a) rely on OS full-disk encryption, (b) require app lock by default, (c) never store the full IBAN or credentials locally |
| App lock | `expo-local-authentication`, required on cold start and after 5 min in background; the app switcher preview is blurred (`expo-blur` overlay on `AppState` change) |
| Backups | Supabase PITR, 7 days. Backups inherit EU residency |
| Secrets in CI | GitHub encrypted secrets + EAS secrets. A CI job greps the diff for key-shaped strings and fails the build |

---

## 4. Authentication

- Passwordless: email OTP (6 digits, 10-minute expiry, 5 attempts), Sign in with Apple, Google.
- Sessions: 1-hour access token, 30-day refresh; refresh rotation on. Revoke-all on password-less identity change.
- No password auth at all → no credential stuffing surface.
- Device list in settings with "log andere apparaten uit".
- Rate limits on OTP request: 5 per email per hour, 20 per IP per hour.

---

## 5. Authorisation

RLS as described in `docs/07` §4 is the **only** authorisation mechanism for data. Rules:
- Every table has RLS enabled; a CI check enumerates `pg_tables` in `public` and fails if any table has `rowsecurity = false`.
- The service-role key is used **only** in Edge Functions, and only for: sync writes, cron jobs, entitlement writes. Every service-role query includes an explicit `household_id` filter derived from a verified JWT.
- pgTAP tests prove that user A cannot read user B's rows on every tenant table, and that a `personal`-scoped row is invisible to another household member.

---

## 6. AVG / GDPR compliance

| Obligation | Implementation |
|---|---|
| **Lawful basis** | Art. 6(1)(b) contract for core budgeting and bank sync; explicit consent (Art. 6(1)(a)) for optional analytics and for the "Ask Kwartje" AI feature |
| **Transparency** (Art. 13) | Privacy policy in plain Dutch, plus an in-app "Wat slaan we op" screen listing every data category with a one-line purpose |
| **Access & portability** (Art. 15/20) | Self-service full JSON + CSV export from `instellingen/privacy`, generated within seconds |
| **Erasure** (Art. 17) | Self-service hard delete: revokes consents at the aggregator, deletes all rows, deletes Storage objects, removes push tokens, writes an audit entry (retained 12 months as legal record, containing only user id and timestamp) |
| **Rectification** (Art. 16) | All user-editable fields are editable in-app |
| **Data minimisation** (Art. 5) | Never request PIS scopes; never store full IBANs; never upload the address book; sync only accounts the user selected |
| **Retention** | Transactions retained while the account exists; deleted accounts purged within 30 days including backups; logs 30 days; audit log 12 months |
| **DPIA** (Art. 35) | **Required** — large-scale processing of financial data. Must be completed and reviewed before public launch. Template outline in §9 |
| **Processors** (Art. 28) | DPAs with Supabase, Enable Banking, Sentry, PostHog, RevenueCat, Expo. Maintain a processor register in `docs/legal/processors.md` |
| **Breach** (Art. 33) | Documented runbook, 72-hour AP notification path, contact in `docs/20` §7 |
| **Children** | Minimum age 16 in the terms; no processing designed for minors |

**Prohibited by policy** (stricter than the law): selling or sharing data with advertisers or data brokers; using customer transaction data to train models; profiling for anything other than the user's own budget; any "insights" feature that shares one user's data with another.

---

## 7. Financial regulation

- **AIS is regulated.** Kwartje reads accounts under the aggregator's AISP licence as a technical service provider or registered agent. **Gate**: written confirmation of this arrangement from counsel + the aggregator before any public release. Until then, closed beta with consenting testers only.
- **No PIS.** We never initiate payments. The UI says so.
- **No advice.** The AFM regime for advising on financial products (insurance, mortgage, credit) is out of scope. Consequences for the product:
  - Never say "switch to insurer X", "this policy is better", "you should refinance".
  - Comparisons must be neutral, sourced, and labelled *"Dit is geen advies."*
  - The zorgverzekering reminder states the deadline and links to public comparison sites; it recommends nothing.
  - The toeslagen module never calculates entitlement; it tracks what was received and links to the Belastingdienst.
- **Wet Van Dam** framing is always hedged (*"waarschijnlijk maandelijks opzegbaar"*), with a note to check the contract.
- **Consumer law for our own subscription**: 14-day withdrawal right, clear pricing, cancel-anytime, no auto-renewal without notice, no dark patterns in the paywall.

---

## 8. Third-party content & IP

- **Nibud reference figures** are Nibud's intellectual property. Ship a *locally editable* reference table seeded from publicly published figures, always attributed with source and year, and obtain written permission (or a licence) before using their data as a commercial feature. If permission is not granted, replace with an internal benchmark computed from aggregated, anonymised, opted-in user data with a minimum cohort size of 500 — never derived from a single household.
- **Bank and merchant logos** are trademarks used nominatively to identify accounts and merchants. Store them as local assets, do not modify them, do not imply endorsement. Remove any logo on request.
- **Never** build a page or screen that imitates a bank's login. The bank redirect always opens the bank's real domain in a system browser session, and the URL bar stays visible.

---

## 9. DPIA outline (to be completed before launch)

1. Description of processing: categories of data, purposes, recipients, retention, transfers.
2. Necessity and proportionality assessment per purpose.
3. Risk register: unauthorised access to transaction data; incorrect budget advice causing financial harm; aggregator breach; account takeover; device loss; re-identification via analytics.
4. Mitigations mapped to §1–§6 of this document.
5. Residual risk and sign-off.
6. Review trigger: any new data category, new processor, or new country.

---

## 10. Security checklist per release

- [ ] RLS enabled on every table (CI check green)
- [ ] pgTAP cross-tenant tests green
- [ ] No `EXPO_PUBLIC_` variable matching `/secret|private|service_role/i`
- [ ] Sentry scrubber unit test green
- [ ] Analytics event audit: no C3 data in any property
- [ ] Dependency audit (`pnpm audit --prod`) with no high/critical
- [ ] New third-party SDKs reviewed for data egress and EU residency
- [ ] Push notification bodies contain no amounts on the lock screen
- [ ] Deep link handler rejects unsigned or replayed `state`
- [ ] App lock cannot be bypassed by backgrounding during the biometric prompt
