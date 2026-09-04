/* ── Text ─────────────────────────────────────────────── */
// (none — SQL DDL only)

/* ── Types ────────────────────────────────────────────── */
// (none)

/* ── Implementation ───────────────────────────────────── */

/**
 * `docs/13` §5: an FTS5 virtual table over `description_clean` and
 * `counterparty_name` for instant search. `transactions` keeps a `TEXT`
 * primary key, so the external-content table is synced on `rowid` (SQLite's
 * implicit row id), the standard pattern for FTS5-over-a-non-integer-PK table.
 * Triggers keep it consistent with every insert/update/delete.
 */
export const MIGRATION_0002_FTS_SQL = `
CREATE VIRTUAL TABLE IF NOT EXISTS transactions_fts USING fts5(
  description_clean,
  counterparty_name,
  content='transactions',
  content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS transactions_fts_ai AFTER INSERT ON transactions BEGIN
  INSERT INTO transactions_fts(rowid, description_clean, counterparty_name)
  VALUES (new.rowid, new.description_clean, new.counterparty_name);
END;

CREATE TRIGGER IF NOT EXISTS transactions_fts_ad AFTER DELETE ON transactions BEGIN
  INSERT INTO transactions_fts(transactions_fts, rowid, description_clean, counterparty_name)
  VALUES ('delete', old.rowid, old.description_clean, old.counterparty_name);
END;

CREATE TRIGGER IF NOT EXISTS transactions_fts_au AFTER UPDATE ON transactions BEGIN
  INSERT INTO transactions_fts(transactions_fts, rowid, description_clean, counterparty_name)
  VALUES ('delete', old.rowid, old.description_clean, old.counterparty_name);
  INSERT INTO transactions_fts(rowid, description_clean, counterparty_name)
  VALUES (new.rowid, new.description_clean, new.counterparty_name);
END;
`;
