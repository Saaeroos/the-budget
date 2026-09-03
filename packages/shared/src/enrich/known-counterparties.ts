/* ── Text ─────────────────────────────────────────────── */
/**
 * A narrow, hand-maintained bridge for the handful of counterparty-naming conventions
 * named explicitly in `docs/09` §2's worked examples (`bol.com b.v.` → `bol`,
 * `Belastingdienst Toeslagen` → `Belastingdienst/Toeslagen`) — NOT the general merchant
 * dictionary (`docs/09` §6), which is a much larger, seed-data-driven table
 * (`supabase/seed/nl_merchants.sql`) matched against a `merchants` DB table outside
 * `packages/shared`. See docs/DECISIONS.md, 2026-09-03 — "counterparty extraction scope".
 */
const KNOWN_COUNTERPARTY_ALIASES: Readonly<Record<string, string>> = {
  'bol.com b.v.': 'bol',
  'belastingdienst toeslagen': 'Belastingdienst/Toeslagen',
};

/* ── Types ────────────────────────────────────────────── */
// (none)

/* ── Implementation ───────────────────────────────────── */

/** Resolves a structured `Naam:`/`NAME` value to its known display alias, or returns it as-is. */
export function resolveKnownCounterpartyAlias(name: string): string {
  const trimmed = name.trim();
  return KNOWN_COUNTERPARTY_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}
