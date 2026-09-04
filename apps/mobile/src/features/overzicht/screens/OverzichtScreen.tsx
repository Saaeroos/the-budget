import { EmptyState } from '@/ui';
import { useT } from '@/i18n';

/* ── Text ──────────────────────────────── */
const TEXT = {
  title: 'overzicht.title',
  body: 'common.coming_soon',
} as const;

const TEST_ID = {
  screen: 'overzicht-screen',
} as const;

/* ── Implementation ───────────────────────── */

/** Placeholder only — wired up by its own ticket. Proves the route resolves. */
export function OverzichtScreen() {
  const t = useT();
  return <EmptyState testID={TEST_ID.screen} title={t(TEXT.title)} body={t(TEXT.body)} />;
}
