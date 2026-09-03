# Rule 08 — Security while coding

Full policy in `docs/16`. These are the rules that bind your keystrokes.

## Never in code

- A secret, key, token, or password — including in a comment, a test, a fixture, or a commented-out line.
- A real IBAN, a real bank export, a real person's transaction, even your own.
- `EXPO_PUBLIC_` on anything that is not genuinely public. Only `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_ENV`, and the dev flags qualify.
- A call to the aggregator from the app. Edge functions only.
- `SELECT *`. Always explicit columns.
- A `security definer` function that returns tenant data without calling `app.is_member()`.

## Never in a log, Sentry event, or analytics event

`description_raw`, `description_clean`, `counterparty_name`, `counterparty_iban_hash`, `note`, `tags`, `amount_cents`, balances, merchant names, category names that could reveal health.

The Sentry `beforeSend` scrubber exists and has a unit test. If you add a new field to a payload that reaches Sentry, add it to the scrubber and to that test in the same commit.

## Every new table

In the same migration file: enable RLS, add select/insert/update/delete policies, add indexes, add a pgTAP test proving user A cannot read user B's rows and that a `personal`-scoped row is invisible to another household member. A migration without these will not be merged.

## Every new edge function

- Verify the JWT and derive `householdId` from it, never from the request body.
- Validate the body with a zod schema from `packages/shared/contracts/`.
- Rate-limit it (`_shared/ratelimit.ts`).
- Return the standard error envelope with a code from `docs/14` §5.
- Never echo a provider token, a raw provider payload, or an internal message to the client.

## Every new dependency

- Justify it in `DECISIONS.md`: what it does, what it costs in bundle size, what data it can see.
- Reject anything that phones home, does attribution, or is US-hosted and touches user data.
- Run `pnpm audit --prod` before merging.

## User-facing security behaviour

- The bank redirect always opens the bank's real domain in a system browser session with the URL bar visible. Never a WebView that could be mistaken for the bank.
- App lock is on by default and cannot be bypassed by backgrounding during the biometric prompt.
- Push notification bodies contain no amount and no merchant.
- Deep-link `state` is signed, single-use and expires in 15 minutes. Reject anything else without explanation to the caller.
