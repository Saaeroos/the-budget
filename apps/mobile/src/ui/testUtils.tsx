// Shared by every `src/ui/**/*.test.tsx` — every component needs a `ThemeProvider` ancestor,
// so this avoids repeating that boilerplate seven times over (`.claude/rules/07-testing.md`
// "one behaviour per test", not one theme-wiring incantation per test).
// `@testing-library/react-native` v14's `render` is async (it awaits React's `act` around the
// new `test-renderer` root), so this — and every test that calls it — awaits it too.
import { render, type RenderResult } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { I18nProvider } from '@/i18n';
import { ThemeProvider, type ThemeOverride } from './ThemeProvider';

/* ── Types ────────────────────────────────────────────── */

export interface RenderThemedOptions {
  readonly override?: ThemeOverride;
}

/* ── Implementation ───────────────────────────────────── */

export function renderThemed(ui: ReactElement, { override }: RenderThemedOptions = {}): Promise<RenderResult> {
  return render(
    <I18nProvider locale="nl">
      <ThemeProvider override={override}>{ui}</ThemeProvider>
    </I18nProvider>,
  );
}
