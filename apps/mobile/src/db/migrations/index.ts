import { MIGRATION_0001_INIT_SQL } from './0001_init';
import { MIGRATION_0002_FTS_SQL } from './0002_fts';

/* ── Text ─────────────────────────────────────────────── */
// (none)

/* ── Types ────────────────────────────────────────────── */

export interface Migration {
  readonly id: string;
  readonly sql: string;
}

/* ── Implementation ───────────────────────────────────── */

/** Applied in this exact order by `../migrate.ts`. Forward-only — never edit
 * a migration once merged, add a new one (`CLAUDE.md` §3). */
export const MIGRATIONS: readonly Migration[] = [
  { id: '0001_init', sql: MIGRATION_0001_INIT_SQL },
  { id: '0002_fts', sql: MIGRATION_0002_FTS_SQL },
];
