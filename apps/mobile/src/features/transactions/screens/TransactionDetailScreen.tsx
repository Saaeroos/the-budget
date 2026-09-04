import { EmptyState } from '@/ui';
import { useT } from '@/i18n';

/* ── Text ──────────────────────────────── */
const TEXT = {
  title: 'transactions.title',
  body: 'transactions.empty_body',
} as const;

const TEST_ID = {
  screen: 'transactie-detail-screen',
} as const;

/* ── Implementation ───────────────────────── */

/** Placeholder only — wired up by its own ticket. Proves the route resolves. */
export function TransactionDetailScreen() {
  const t = useT();
  return <EmptyState testID={TEST_ID.screen} title={t(TEXT.title)} body={t(TEXT.body)} />;
}
