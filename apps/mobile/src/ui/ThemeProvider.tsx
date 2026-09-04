// Resolves `tokens.ts` into a `Theme` from `useColorScheme()` plus a manual override
// (`docs/12` §9). Components never call `useColorScheme()` themselves — they call `useTheme()`.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { resolveTheme, type ColorScheme, type Theme } from './tokens';

/* ── Text ─────────────────────────────────────────────── */
// Not user-facing copy — a programmer-error invariant message, same convention as
// `packages/shared`'s `MONEY_TEXT`/`DATES_TEXT` (docs/DECISIONS.md, 2026-09-03).
const DEV_ERROR = {
  missingProvider: 'useTheme must be used within a ThemeProvider',
} as const;

/* ── Types ────────────────────────────────────────────── */

/** Dutch settings-screen values, kept as the override vocabulary throughout the app. */
export type ThemeOverride = 'systeem' | 'licht' | 'donker';

export interface ThemeProviderProps {
  readonly children: ReactNode;
  /**
   * Controlled override (e.g. synced with a persisted preference in `@/store`). When omitted,
   * the provider manages its own state starting from `defaultOverride` — `ui/` never reaches
   * into storage itself.
   */
  readonly override?: ThemeOverride | undefined;
  /** Called whenever `setOverride` changes the value, whether controlled or not. */
  readonly onOverrideChange?: ((override: ThemeOverride) => void) | undefined;
  readonly defaultOverride?: ThemeOverride | undefined;
}

interface ThemeContextValue {
  readonly theme: Theme;
  readonly override: ThemeOverride;
  readonly setOverride: (override: ThemeOverride) => void;
}

/* ── Implementation ───────────────────────────────────── */

const DEFAULT_OVERRIDE: ThemeOverride = 'systeem';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function schemeFor(override: ThemeOverride, system: ColorScheme): ColorScheme {
  if (override === 'licht') return 'light';
  if (override === 'donker') return 'dark';
  return system;
}

export function ThemeProvider({ children, override, onOverrideChange, defaultOverride }: ThemeProviderProps) {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [internalOverride, setInternalOverride] = useState<ThemeOverride>(defaultOverride ?? DEFAULT_OVERRIDE);
  const resolvedOverride = override ?? internalOverride;

  const setOverride = useCallback(
    (next: ThemeOverride) => {
      setInternalOverride(next);
      onOverrideChange?.(next);
    },
    [onOverrideChange],
  );

  const theme = useMemo(() => resolveTheme(schemeFor(resolvedOverride, system)), [resolvedOverride, system]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, override: resolvedOverride, setOverride }),
    [theme, resolvedOverride, setOverride],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error(DEV_ERROR.missingProvider);
  }
  return ctx;
}
