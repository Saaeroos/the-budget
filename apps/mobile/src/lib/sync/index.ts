// Public surface of the outbox/sync engine (`docs/13` §6, `docs/06` §10).
export { nextBackoffMs, isParked } from './backoff';
export { flushOutbox, type FlushOutboxDeps, type FlushOutboxSummary, type OutboxGateway } from './flush';
export { createSupabaseOutboxGateway } from './gateway';
export { enqueueOutboxRow, listDueOutboxRows, markOutboxFailure, markOutboxSuccess } from './outbox';
export {
  resolveSplitsConflict,
  resolveTransactionConflict,
  type CategorySource,
  type TransactionConflictFields,
  type TransactionSplitRow,
} from './resolve';
export {
  OUTBOX_ENTITY,
  OUTBOX_OP,
  type NewOutboxRow,
  type OutboxEntity,
  type OutboxFailurePatch,
  type OutboxOp,
  type OutboxRow,
} from './types';
