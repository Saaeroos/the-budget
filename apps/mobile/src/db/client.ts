import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

/* ── Text ─────────────────────────────────────────────── */
// (none — no user-facing or logged strings)

/* ── Types ────────────────────────────────────────────── */

export type KwartjeSchema = typeof schema;
export type KwartjeDatabase = ExpoSQLiteDatabase<KwartjeSchema>;

export interface DatabaseClient {
  /** The raw expo-sqlite handle — used only by the migration runner, which
   * needs `execSync` for DDL and virtual-table statements drizzle doesn't model. */
  readonly native: SQLiteDatabase;
  readonly db: KwartjeDatabase;
}

const LIMITS = {
  defaultName: 'kwartje.db',
} as const;

/* ── Implementation ───────────────────────────────────── */

/**
 * Opens (or creates) the on-device SQLite mirror and wraps it with drizzle.
 * Takes the database name as a parameter rather than reaching for a
 * module-level singleton (Rule 04 — dependency inversion), so
 * `DatabaseProvider` can inject a per-fixture-household name in dev
 * (`docs/24` §3's user switcher) and tests can inject an isolated one.
 */
export function createDatabaseClient(name: string = LIMITS.defaultName): DatabaseClient {
  const native = openDatabaseSync(name);
  const db = drizzle(native, { schema });
  return { native, db };
}
