import { create } from 'zustand';

/* ── Text ─────────────────────────────────────────────── */
// (none — filter values carry no user-facing or logged strings)

/* ── Types ────────────────────────────────────────────── */

export interface TransactionFilterState {
  readonly categoryIds: readonly string[];
  readonly accountIds: readonly string[];
  readonly onlyNeedsReview: boolean;
  readonly searchQuery: string;
  readonly setCategoryIds: (ids: readonly string[]) => void;
  readonly setAccountIds: (ids: readonly string[]) => void;
  readonly setSearchQuery: (query: string) => void;
  readonly toggleNeedsReview: () => void;
  readonly reset: () => void;
}

type FilterValues = Pick<TransactionFilterState, 'categoryIds' | 'accountIds' | 'onlyNeedsReview' | 'searchQuery'>;

const INITIAL: FilterValues = { categoryIds: [], accountIds: [], onlyNeedsReview: false, searchQuery: '' };

/* ── Implementation ───────────────────────────────────── */

/**
 * Transaction list filters (`docs/11` §3). Never persisted — a fresh
 * `(tabs)/transacties` visit starts unfiltered. The query key factory for
 * `transactions` includes this state directly (`.claude/rules/05` — "the bridge").
 */
export const useTransactionFilters = create<TransactionFilterState>()((set) => ({
  ...INITIAL,
  setCategoryIds: (categoryIds) => set({ categoryIds }),
  setAccountIds: (accountIds) => set({ accountIds }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleNeedsReview: () => set((s) => ({ onlyNeedsReview: !s.onlyNeedsReview })),
  reset: () => set({ ...INITIAL }),
}));

/* ── Narrow selectors — never subscribe to the whole store ── */
export const useFilterCategoryIds = (): readonly string[] => useTransactionFilters((s) => s.categoryIds);
export const useFilterAccountIds = (): readonly string[] => useTransactionFilters((s) => s.accountIds);
export const useFilterOnlyNeedsReview = (): boolean => useTransactionFilters((s) => s.onlyNeedsReview);
export const useFilterSearchQuery = (): string => useTransactionFilters((s) => s.searchQuery);

/** The plain-object payload a query key factory embeds — pass this to
 * `useShallow` at the call site, never the raw store hook unselected. */
export function selectFilterPayload(state: TransactionFilterState): FilterValues {
  return {
    categoryIds: state.categoryIds,
    accountIds: state.accountIds,
    onlyNeedsReview: state.onlyNeedsReview,
    searchQuery: state.searchQuery,
  };
}
