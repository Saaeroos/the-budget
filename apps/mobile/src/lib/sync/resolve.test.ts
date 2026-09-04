import { cents } from '@shared';
import {
  resolveSplitsConflict,
  resolveTransactionConflict,
  type TransactionConflictFields,
  type TransactionSplitRow,
} from './resolve';

/* ── Text ─────────────────────────────────────────────── */
// (none — test file)

/* ── Types ────────────────────────────────────────────── */
// (none — test file)

function baseRow(overrides: Partial<TransactionConflictFields> = {}): TransactionConflictFields {
  return {
    bookedAt: '2026-09-01',
    valueAt: '2026-09-01',
    amountCents: cents(1000),
    direction: 'out',
    status: 'booked',
    descriptionRaw: 'RAW',
    descriptionClean: 'clean',
    counterpartyName: 'Albert Heijn',
    merchantId: 'merchant-1',
    categoryId: 'cat-1',
    categorySource: 'heuristic',
    categoryConfidence: 0.6,
    isTransfer: false,
    isExcluded: false,
    note: null,
    tags: [],
    updatedAt: '2026-09-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('resolveTransactionConflict — bank-derived fields (server wins)', () => {
  it('keeps the server value for every bank-derived field even when the client is newer', () => {
    const server = baseRow({
      bookedAt: '2026-09-02',
      valueAt: '2026-09-02',
      amountCents: cents(2500),
      direction: 'in',
      status: 'pending',
      descriptionRaw: 'SERVER RAW',
      descriptionClean: 'server clean',
      counterpartyName: 'Jumbo',
      merchantId: 'merchant-server',
      isTransfer: true,
      updatedAt: '2026-09-01T09:00:00.000Z',
    });
    const client = baseRow({ updatedAt: '2026-09-01T23:00:00.000Z' });

    const merged = resolveTransactionConflict(server, client);

    expect(merged.bookedAt).toBe(server.bookedAt);
    expect(merged.valueAt).toBe(server.valueAt);
    expect(merged.amountCents).toBe(server.amountCents);
    expect(merged.direction).toBe(server.direction);
    expect(merged.status).toBe(server.status);
    expect(merged.descriptionRaw).toBe(server.descriptionRaw);
    expect(merged.descriptionClean).toBe(server.descriptionClean);
    expect(merged.counterpartyName).toBe(server.counterpartyName);
    expect(merged.merchantId).toBe(server.merchantId);
    expect(merged.isTransfer).toBe(server.isTransfer);
  });
});

describe('resolveTransactionConflict — user-set fields (client wins)', () => {
  it('keeps the client value for note, tags and isExcluded even when the server is newer', () => {
    const server = baseRow({
      note: 'server note',
      tags: ['server-tag'],
      isExcluded: false,
      updatedAt: '2026-09-02T00:00:00.000Z',
    });
    const client = baseRow({
      note: 'client note',
      tags: ['client-tag'],
      isExcluded: true,
      updatedAt: '2026-09-01T00:00:00.000Z',
    });

    const merged = resolveTransactionConflict(server, client);

    expect(merged.note).toBe('client note');
    expect(merged.tags).toEqual(['client-tag']);
    expect(merged.isExcluded).toBe(true);
  });
});

describe('resolveTransactionConflict — category (Invariant I-6)', () => {
  it('keeps the client category when the client set it itself', () => {
    const server = baseRow({ categoryId: 'cat-server', categorySource: 'rule', categoryConfidence: 0.9 });
    const client = baseRow({ categoryId: 'cat-client', categorySource: 'user', categoryConfidence: 1 });

    const merged = resolveTransactionConflict(server, client);

    expect(merged.categoryId).toBe('cat-client');
    expect(merged.categorySource).toBe('user');
    expect(merged.categoryConfidence).toBe(1);
  });

  it('falls back to the server category when the client has not categorised it itself', () => {
    const server = baseRow({ categoryId: 'cat-server', categorySource: 'rule', categoryConfidence: 0.9 });
    const client = baseRow({ categoryId: 'cat-client', categorySource: 'heuristic', categoryConfidence: 0.4 });

    const merged = resolveTransactionConflict(server, client);

    expect(merged.categoryId).toBe('cat-server');
    expect(merged.categorySource).toBe('rule');
    expect(merged.categoryConfidence).toBe(0.9);
  });
});

describe('resolveTransactionConflict — updatedAt', () => {
  it('takes the server timestamp when the server is strictly newer', () => {
    const server = baseRow({ updatedAt: '2026-09-03T12:00:00.000Z' });
    const client = baseRow({ updatedAt: '2026-09-02T12:00:00.000Z' });

    expect(resolveTransactionConflict(server, client).updatedAt).toBe(server.updatedAt);
  });

  it('takes the client timestamp when the client is strictly newer', () => {
    const server = baseRow({ updatedAt: '2026-09-01T12:00:00.000Z' });
    const client = baseRow({ updatedAt: '2026-09-03T12:00:00.000Z' });

    expect(resolveTransactionConflict(server, client).updatedAt).toBe(client.updatedAt);
  });

  it('favours the client on an exact tie', () => {
    const same = '2026-09-01T12:00:00.000Z';
    const server = baseRow({ updatedAt: same });
    const client = baseRow({ updatedAt: same, note: 'client note' });

    expect(resolveTransactionConflict(server, client).updatedAt).toBe(same);
  });
});

describe('resolveSplitsConflict', () => {
  it('always returns the client splits, ignoring the server set entirely', () => {
    const server: readonly TransactionSplitRow[] = [{ categoryId: 'a', amountCents: cents(500), note: null }];
    const client: readonly TransactionSplitRow[] = [
      { categoryId: 'b', amountCents: cents(300), note: 'boodschappen' },
      { categoryId: 'c', amountCents: cents(700), note: null },
    ];

    expect(resolveSplitsConflict(server, client)).toBe(client);
  });
});
