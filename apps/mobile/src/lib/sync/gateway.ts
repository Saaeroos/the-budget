import type { KwartjeDatabase } from '@/db/client';
import { supabase } from '@/lib/supabase';
import type { OutboxGateway } from './flush';
import { listDueOutboxRows, markOutboxFailure, markOutboxSuccess } from './outbox';
import type { OutboxRow } from './types';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  sendFailed: 'outbox gateway: Supabase rejected the row',
} as const;

/* ── Types ────────────────────────────────────────────── */
// (none beyond `OutboxGateway`, from `./flush`)

/* ── Implementation ───────────────────────────────────── */

/**
 * Generic entity → PostgREST dispatch: every outbox row already carries the
 * full row it wants written, so `insert`/`update`/`delete` map directly onto
 * `supabase.from(row.entity)`. A feature repository with entity-specific
 * needs can later provide its own `OutboxGateway.send` — this is the v1,
 * good enough while `queries/` repositories don't exist yet.
 */
async function sendToSupabase(row: OutboxRow): Promise<void> {
  const table = supabase.from(row.entity);
  const result =
    row.op === 'insert'
      ? await table.insert(row.payload)
      : row.op === 'update'
        ? await table.update(row.payload).eq('id', row.entityId)
        : await table.delete().eq('id', row.entityId);

  if (result.error) throw new Error(`${TEXT.sendFailed}: ${result.error.message}`);
}

/** The concrete `OutboxGateway` `SyncProvider` injects into `flushOutbox`. */
export function createSupabaseOutboxGateway(db: KwartjeDatabase): OutboxGateway {
  return {
    listDue: () => listDueOutboxRows(db, new Date()),
    send: sendToSupabase,
    markSuccess: (id) => markOutboxSuccess(db, id),
    markFailure: (id, patch) => markOutboxFailure(db, id, patch),
  };
}
