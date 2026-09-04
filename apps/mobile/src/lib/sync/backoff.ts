/* ── Text ─────────────────────────────────────────────── */
// (none — pure logic)

/* ── Types ────────────────────────────────────────────── */
// (none — plain numbers in, plain numbers out)

const LIMITS = {
  /** First retry waits 1s. */
  baseDelayMs: 1_000,
  /** Never wait longer than a minute between retries. */
  maxDelayMs: 60_000,
  /** `docs/13` §6: a row failing 5 times is parked. */
  maxAttempts: 5,
} as const;

/* ── Implementation ───────────────────────────────────── */

/** Exponential backoff, capped: 1s, 2s, 4s, 8s, 16s, then clamped at 60s. */
export function nextBackoffMs(attempts: number): number {
  const delay = LIMITS.baseDelayMs * 2 ** Math.max(attempts, 0);
  return Math.min(delay, LIMITS.maxDelayMs);
}

/** A row that has failed `maxAttempts` times is parked: it stops being
 * retried automatically and is surfaced in settings with a manual retry. */
export function isParked(attempts: number): boolean {
  return attempts >= LIMITS.maxAttempts;
}
