import { asc, eq, isNull, lte, or } from 'drizzle-orm';
import type { KwartjeDatabase } from '@/db/client';
import { outbox } from '@/db/schema';
import { isParked } from './backoff';
import type { NewOutboxRow, OutboxEntity, OutboxFailurePatch, OutboxRow } from './types';

/* ── Text ─────────────────────────────────────────────── */
// (none — no user-facing or logged strings)

/* ── Types ────────────────────────────────────────────── */
// (none beyond what `./types` already declares)

/* ── Implementation ───────────────────────────────────── */

/** Outbox row ids are local-only — never sent anywhere as an entity
 * identifier — so a `Math.random()`-based v4 is sufficient; no crypto
 * dependency needed for this. */
function generateOutboxId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/** Optimistic write step 2 of 3 (`docs/13` §6): after the SQLite write, append
 * the outbox row that will replay it to Supabase. */
export async function enqueueOutboxRow(db: KwartjeDatabase, input: NewOutboxRow): Promise<OutboxRow> {
  const row: OutboxRow = {
    id: generateOutboxId(),
    entity: input.entity,
    entityId: input.entityId,
    op: input.op,
    payload: input.payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
    nextAttemptAt: null,
  };
  await db.insert(outbox).values(row);
  return row;
}

/** Rows due for a flush attempt: not yet due for backoff, in insertion
 * order. Parked rows (`docs/13` §6 — failed 5 times) are filtered out here
 * rather than in SQL, since "parked" is `backoff.ts`'s policy, not a column. */
export async function listDueOutboxRows(db: KwartjeDatabase, now: Date): Promise<readonly OutboxRow[]> {
  const nowIso = now.toISOString();
  const rows = await db
    .select()
    .from(outbox)
    .where(or(isNull(outbox.nextAttemptAt), lte(outbox.nextAttemptAt, nowIso)))
    .orderBy(asc(outbox.createdAt));

  return rows.filter((row) => !isParked(row.attempts)).map((row) => ({ ...row, entity: row.entity as OutboxEntity }));
}

export async function markOutboxSuccess(db: KwartjeDatabase, id: string): Promise<void> {
  await db.delete(outbox).where(eq(outbox.id, id));
}

export async function markOutboxFailure(db: KwartjeDatabase, id: string, patch: OutboxFailurePatch): Promise<void> {
  await db
    .update(outbox)
    .set({ attempts: patch.attempts, lastError: patch.error, nextAttemptAt: patch.nextAttemptAt })
    .where(eq(outbox.id, id));
}
