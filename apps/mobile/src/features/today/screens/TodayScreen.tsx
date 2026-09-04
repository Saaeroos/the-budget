import { EmptyState } from '@/ui';
import { useT } from '@/i18n';

/* ── Text ──────────────────────────────── */
const TEXT = {
  title: 'today.title',
  body: 'today.upcoming_empty',
} as const;

const TEST_ID = {
  screen: 'vandaag-screen',
} as const;

/* ── Implementation ───────────────────────── */

/** Placeholder only — wired up by its own ticket. Proves the route resolves. */
export function TodayScreen() {
  const t = useT();
  return <EmptyState testID={TEST_ID.screen} title={t(TEXT.title)} body={t(TEXT.body)} />;
}
