import type { Cents } from '@shared';

/* ── Text ─────────────────────────────────────────────── */
// (none — pure logic, no user-facing or logged strings)

/* ── Types ────────────────────────────────────────────── */

/** `transactions.category_source` (`docs/06` §4). */
export type CategorySource = 'rule' | 'merchant' | 'series' | 'heuristic' | 'user' | 'unset';

/**
 * The subset of `transactions` columns that can be written by both the sync
 * engine (server) and the user (client) and therefore need a merge policy.
 * Purely structural/identity columns (`id`, `household_id`, `account_id`, …)
 * are never merged — they are set once and never diverge.
 */
export interface TransactionConflictFields {
  readonly bookedAt: string;
  readonly valueAt: string | null;
  readonly amountCents: Cents;
  readonly direction: 'in' | 'out';
  readonly status: 'booked' | 'pending';
  readonly descriptionRaw: string;
  readonly descriptionClean: string;
  readonly counterpartyName: string | null;
  readonly merchantId: string | null;
  readonly categoryId: string | null;
  readonly categorySource: CategorySource;
  readonly categoryConfidence: number;
  readonly isTransfer: boolean;
  readonly isExcluded: boolean;
  readonly note: string | null;
  readonly tags: readonly string[];
  /** RFC3339 UTC instant. */
  readonly updatedAt: string;
}

/** One row of `transaction_splits`. Never bank-derived — the server has no
 * independent writer for splits, so there is nothing to merge field-by-field. */
export interface TransactionSplitRow {
  readonly categoryId: string | null;
  readonly amountCents: Cents;
  readonly note: string | null;
}

/* ── Implementation ───────────────────────────────────── */

/** Columns the bank sync (never the user) owns — the server's value always wins,
 * regardless of either side's `updated_at` (`docs/06` §10, `docs/13` §6). */
const SERVER_OWNED_KEYS = [
  'bookedAt',
  'valueAt',
  'amountCents',
  'direction',
  'status',
  'descriptionRaw',
  'descriptionClean',
  'counterpartyName',
  'merchantId',
  'isTransfer',
] as const satisfies readonly (keyof TransactionConflictFields)[];

/** Columns only the user ever sets — the client's value always wins
 * (Invariant I-6 covers `categoryId`/`categorySource` separately, below). */
const CLIENT_OWNED_KEYS = ['note', 'tags', 'isExcluded'] as const satisfies readonly (keyof TransactionConflictFields)[];

function pickServerOwned(
  server: TransactionConflictFields,
): Pick<TransactionConflictFields, (typeof SERVER_OWNED_KEYS)[number]> {
  const result = {} as Pick<TransactionConflictFields, (typeof SERVER_OWNED_KEYS)[number]>;
  for (const key of SERVER_OWNED_KEYS) {
    (result as Record<string, unknown>)[key] = server[key];
  }
  return result;
}

function pickClientOwned(
  client: TransactionConflictFields,
): Pick<TransactionConflictFields, (typeof CLIENT_OWNED_KEYS)[number]> {
  const result = {} as Pick<TransactionConflictFields, (typeof CLIENT_OWNED_KEYS)[number]>;
  for (const key of CLIENT_OWNED_KEYS) {
    (result as Record<string, unknown>)[key] = client[key];
  }
  return result;
}

/** Invariant I-6: a user-set category is never overwritten by anything automatic.
 * If the client hasn't (yet) categorised the row itself, the server's — possibly
 * freshly re-enriched — category applies. */
function resolveCategory(
  server: TransactionConflictFields,
  client: TransactionConflictFields,
): Pick<TransactionConflictFields, 'categoryId' | 'categorySource' | 'categoryConfidence'> {
  const source = client.categorySource === 'user' ? client : server;
  return {
    categoryId: source.categoryId,
    categorySource: source.categorySource,
    categoryConfidence: source.categoryConfidence,
  };
}

/** The merged row keeps whichever side touched it more recently — ties favour
 * the client, since it is the row currently being flushed. */
function resolveUpdatedAt(server: TransactionConflictFields, client: TransactionConflictFields): string {
  const serverTime = new Date(server.updatedAt).getTime();
  const clientTime = new Date(client.updatedAt).getTime();
  return serverTime > clientTime ? server.updatedAt : client.updatedAt;
}

/**
 * Merges a server row and a locally-edited client row into the row that should
 * be written back to SQLite, field by field (`docs/06` §10, `docs/13` §6).
 * Never a whole-row last-write-wins — every field's owner is fixed by policy.
 */
export function resolveTransactionConflict(
  server: TransactionConflictFields,
  client: TransactionConflictFields,
): TransactionConflictFields {
  return {
    ...pickServerOwned(server),
    ...pickClientOwned(client),
    ...resolveCategory(server, client),
    updatedAt: resolveUpdatedAt(server, client),
  };
}

/** Splits are user-authored only — the client's set always wins outright. */
export function resolveSplitsConflict(
  _server: readonly TransactionSplitRow[],
  client: readonly TransactionSplitRow[],
): readonly TransactionSplitRow[] {
  return client;
}
