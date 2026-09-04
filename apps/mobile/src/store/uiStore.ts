import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { prefsStorage, toPersistStorage } from '@/lib/storage';

/* ── Text ─────────────────────────────────────────────── */
// (none — UI state carries no user-facing or logged strings)

/* ── Types ────────────────────────────────────────────── */

export type ThemeOverride = 'system' | 'light' | 'dark';

export interface UiState {
  /** Persisted (`.claude/rules/05-state-management.md`: theme is a user preference). */
  readonly themeOverride: ThemeOverride;
  /** The budget period the user is currently viewing across Vandaag/Budget/Overzicht.
   * Not persisted — a fresh launch always starts on the current period. */
  readonly activePeriodId: string | null;
  readonly setThemeOverride: (value: ThemeOverride) => void;
  readonly setActivePeriodId: (id: string | null) => void;
}

const LIMITS = { storageKey: 'kwartje.ui' } as const;

/* ── Implementation ───────────────────────────────────── */

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      themeOverride: 'system',
      activePeriodId: null,
      setThemeOverride: (themeOverride) => set({ themeOverride }),
      setActivePeriodId: (activePeriodId) => set({ activePeriodId }),
    }),
    {
      name: LIMITS.storageKey,
      storage: createJSONStorage(() => toPersistStorage(prefsStorage)),
      // Only the preference persists — `activePeriodId` is session-scoped.
      partialize: (state) => ({ themeOverride: state.themeOverride }),
    },
  ),
);

/* ── Narrow selectors — never subscribe to the whole store ── */
export const useThemeOverride = (): ThemeOverride => useUiStore((s) => s.themeOverride);
export const useSetThemeOverride = (): UiState['setThemeOverride'] => useUiStore((s) => s.setThemeOverride);
export const useActivePeriodId = (): string | null => useUiStore((s) => s.activePeriodId);
export const useSetActivePeriodId = (): UiState['setActivePeriodId'] => useUiStore((s) => s.setActivePeriodId);
