/* ── Text ─────────────────────────────────────────────── */
// (none — types only)

/* ── Types ────────────────────────────────────────────── */

/** Local-mirror tables the app writes to optimistically and must therefore
 * replay through the outbox (`docs/06` §10). Read-mostly mirrored tables
 * (`categories`, `merchants`, `accounts`, `recurring_series`) are populated
 * by sync-down only and never appear here. */
export const OUTBOX_ENTITY = {
  transaction: 'transactions',
  transactionSplit: 'transaction_splits',
  splitParticipant: 'split_participants',
  budgetLine: 'budget_lines',
  envelope: 'envelopes',
  rule: 'rules',
} as const;
export type OutboxEntity = (typeof OUTBOX_ENTITY)[keyof typeof OUTBOX_ENTITY];

export const OUTBOX_OP = { insert: 'insert', update: 'update', delete: 'delete' } as const;
export type OutboxOp = (typeof OUTBOX_OP)[keyof typeof OUTBOX_OP];

/** One row of the device `outbox` table (`docs/06` §10), extended with
 * `nextAttemptAt` — not in the spec's column list, needed to schedule
 * per-row exponential backoff across app restarts (see `docs/DECISIONS.md`). */
export interface OutboxRow {
  readonly id: string;
  readonly entity: OutboxEntity;
  readonly entityId: string;
  readonly op: OutboxOp;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
  readonly attempts: number;
  readonly lastError: string | null;
  readonly nextAttemptAt: string | null;
}

/** The fields needed to enqueue a new outbox row; the rest are assigned by
 * `enqueueOutboxRow` (`id`, `createdAt`, zeroed retry state). */
export type NewOutboxRow = Pick<OutboxRow, 'entity' | 'entityId' | 'op' | 'payload'>;

/** Grouped so `markFailure`/`markOutboxFailure` stay at 3 parameters
 * (`.claude/rules/03-file-size.md` — max 3, then take an object). */
export interface OutboxFailurePatch {
  readonly attempts: number;
  readonly error: string;
  readonly nextAttemptAt: string;
}
