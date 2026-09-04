import { isParked, nextBackoffMs } from './backoff';
import type { OutboxFailurePatch, OutboxRow } from './types';

/* ── Text ─────────────────────────────────────────────── */
// (none — pure orchestration, no user-facing or logged strings)

/* ── Types ────────────────────────────────────────────── */

/**
 * The port `flushOutbox` depends on (Rule 04 — dependency inversion). A
 * concrete implementation (`createSupabaseOutboxGateway` in `gateway.ts`)
 * is injected by `SyncProvider`; tests inject a fake instead.
 *
 * `listDue` must already return rows in insertion order, excluding parked
 * rows and rows whose `nextAttemptAt` has not yet elapsed — that filtering
 * is a SQLite query concern, not this module's.
 */
export interface OutboxGateway {
  readonly listDue: () => Promise<readonly OutboxRow[]>;
  readonly send: (row: OutboxRow) => Promise<void>;
  readonly markSuccess: (id: string) => Promise<void>;
  readonly markFailure: (id: string, patch: OutboxFailurePatch) => Promise<void>;
}

export interface FlushOutboxDeps {
  readonly gateway: OutboxGateway;
  /** Injected so retry scheduling is deterministic in tests (Rule 04: `today`/`now` is always a parameter). */
  readonly now: () => Date;
}

export interface FlushOutboxSummary {
  readonly total: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly parked: number;
}

/* ── Implementation ───────────────────────────────────── */

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function flushOne(row: OutboxRow, deps: FlushOutboxDeps): Promise<'succeeded' | 'failed' | 'parked'> {
  try {
    await deps.gateway.send(row);
    await deps.gateway.markSuccess(row.id);
    return 'succeeded';
  } catch (error) {
    const attempts = row.attempts + 1;
    const nextAttemptAt = new Date(deps.now().getTime() + nextBackoffMs(attempts)).toISOString();
    await deps.gateway.markFailure(row.id, { attempts, error: toMessage(error), nextAttemptAt });
    return isParked(attempts) ? 'parked' : 'failed';
  }
}

/**
 * Flushes the outbox: rows are sent **sequentially, in insertion order**
 * (`docs/13` §6) so a later edit never lands before an earlier one for the
 * same entity. One row's failure never blocks the rows behind it.
 */
export async function flushOutbox(deps: FlushOutboxDeps): Promise<FlushOutboxSummary> {
  const rows = await deps.gateway.listDue();
  const summary = { total: rows.length, succeeded: 0, failed: 0, parked: 0 };

  for (const row of rows) {
    const outcome = await flushOne(row, deps);
    summary[outcome] += 1;
  }

  return summary;
}
