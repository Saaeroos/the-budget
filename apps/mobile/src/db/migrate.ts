import type { SQLiteDatabase } from 'expo-sqlite';
import { MIGRATIONS } from './migrations';

/* ── Text ─────────────────────────────────────────────── */
// (none — no user-facing or logged strings)

/* ── Types ────────────────────────────────────────────── */

interface AppliedMigrationRow {
  readonly id: string;
}

/* ── Implementation ───────────────────────────────────── */

function ensureMigrationsTable(native: SQLiteDatabase): void {
  native.execSync('CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);');
}

function appliedMigrationIds(native: SQLiteDatabase): ReadonlySet<string> {
  const rows = native.getAllSync<AppliedMigrationRow>('SELECT id FROM _migrations;');
  return new Set(rows.map((row) => row.id));
}

/**
 * Applies every pending migration from `./migrations`, in order, each in its
 * own transaction, tracked in a local `_migrations` table. Synchronous, so
 * `DatabaseProvider` can run it before children render (`docs/13` §5).
 */
export function runMigrations(native: SQLiteDatabase): void {
  ensureMigrationsTable(native);
  const applied = appliedMigrationIds(native);

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    native.withTransactionSync(() => {
      native.execSync(migration.sql);
      native.runSync('INSERT INTO _migrations (id, applied_at) VALUES (?, ?);', [migration.id, new Date().toISOString()]);
    });
  }
}
