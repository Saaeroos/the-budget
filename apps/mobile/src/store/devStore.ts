import { create } from 'zustand';
import { devAuth } from '@/lib/devAuth';

/* ── Text ─────────────────────────────────────────────── */
// (none — dev-only tooling state, never shown outside a dev build)

/* ── Types ────────────────────────────────────────────── */

/** `docs/24` §3 — forces a screen into one state for QA, regardless of what
 * react-query actually knows. */
export const FORCED_STATE = {
  none: 'none',
  loading: 'loading',
  empty: 'empty',
  error: 'error',
  offline: 'offline',
  stale: 'stale',
} as const;
export type ForcedState = (typeof FORCED_STATE)[keyof typeof FORCED_STATE];

export interface DevState {
  /** `NLDate` string, or `null` to use the real device date. Pure `logic/`
   * functions still take `today` as a parameter — this only supplies it. */
  readonly dateOverride: string | null;
  readonly forcedState: ForcedState;
  /** Which of the three seeded fixture households (`docs/24` §4) the dev
   * user-switcher currently points at. */
  readonly activeFixtureHouseholdId: string;
  readonly setDateOverride: (date: string | null) => void;
  readonly setForcedState: (state: ForcedState) => void;
  readonly setActiveFixtureHouseholdId: (householdId: string) => void;
  readonly reset: () => void;
}

/* ── Implementation ───────────────────────────────────── */

function initialState(): Pick<DevState, 'dateOverride' | 'forcedState' | 'activeFixtureHouseholdId'> {
  return { dateOverride: null, forcedState: FORCED_STATE.none, activeFixtureHouseholdId: devAuth.householdId };
}

/** Dev-only tooling state — never read outside a `devAuth.enabled`/`__DEV__`
 * guard, so Metro's dead-code path can strip its call sites from release
 * bundles (`docs/24` §3). */
export const useDevStore = create<DevState>()((set) => ({
  ...initialState(),
  setDateOverride: (dateOverride) => set({ dateOverride }),
  setForcedState: (forcedState) => set({ forcedState }),
  setActiveFixtureHouseholdId: (activeFixtureHouseholdId) => set({ activeFixtureHouseholdId }),
  reset: () => set(initialState()),
}));

/* ── Narrow selectors — never subscribe to the whole store ── */
export const useDevDateOverride = (): string | null => useDevStore((s) => s.dateOverride);
export const useDevForcedState = (): ForcedState => useDevStore((s) => s.forcedState);
export const useDevActiveFixtureHouseholdId = (): string => useDevStore((s) => s.activeFixtureHouseholdId);
