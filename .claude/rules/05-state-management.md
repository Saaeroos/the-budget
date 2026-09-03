# Rule 05 — State management: TanStack Query + Zustand

Two tools, two jobs, no overlap.

## The division

| State | Owner | Persisted? |
|---|---|---|
| Anything that came from or goes to the server or SQLite | **TanStack Query** | via MMKV persister, `gcTime` 24h |
| Anything that only exists while the user looks at a screen | **Zustand** | no |
| User preferences (theme, quiet hours, last used filter) | **Zustand**, persisted slice | MMKV |
| Session / auth | `AuthProvider` context + secure-store | Keychain/Keystore |
| Form state | `react-hook-form` | no |
| Navigation state | expo-router | no |

**Never** copy server data into zustand. **Never** put ephemeral UI flags into a query cache. If you find yourself writing `setTransactions(data)` in a zustand store, stop — that is what the query cache is.

## TanStack Query

### Keys
One factory per feature, in `features/<x>/queries/keys.ts`. Keys are hierarchical so invalidation is surgical:

```ts
export const envelopeKeys = {
  all: (h: HouseholdId) => ['envelopes', h] as const,
  list: (h: HouseholdId) => [...envelopeKeys.all(h), 'list'] as const,
  detail: (h: HouseholdId, id: string) => [...envelopeKeys.all(h), 'detail', id] as const,
} as const;
```
Never inline a key array at a call site.

### One hook per file
`useEnvelopes.ts`, `useEnvelope.ts`, `useCreateEnvelope.ts`, `useUpdateEnvelope.ts`. A hook file exports one hook, its props type, and nothing else.

### Query hooks are thin
A query hook does three things: build the key, call the repository, and select. All data shaping is a `select` calling a pure function from `logic/`.

```ts
export function useEnvelopes() {
  const { householdId } = useHousehold();
  return useQuery({
    queryKey: envelopeKeys.list(householdId),
    queryFn: () => envelopeRepository.list(householdId),
    select: (rows) => rows.map(toEnvelopeViewModel),   // pure, tested
  });
}
```

### Mutations are optimistic and offline-safe
Every mutation follows the same shape: write to SQLite, append to the outbox, update the cache, roll back on failure.

```ts
export function useUpdateEnvelope() {
  const qc = useQueryClient();
  const { householdId } = useHousehold();
  return useMutation({
    mutationFn: (input: UpdateEnvelopeInput) => envelopeRepository.update(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: envelopeKeys.all(householdId) });
      const previous = qc.getQueryData(envelopeKeys.list(householdId));
      qc.setQueryData(envelopeKeys.list(householdId), (old) => applyUpdate(old, input));
      return { previous };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(envelopeKeys.list(householdId), ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: envelopeKeys.all(householdId) }),
  });
}
```
`applyUpdate` is pure and tested. No inline cache surgery.

### Defaults (set once in `queryClient.ts`)
`staleTime: 60_000` · `gcTime: 24h` · `retry: 2` exponential · `refetchOnWindowFocus: false` · `refetchOnReconnect: true` · `throwOnError: false` (errors are rendered, not thrown).

### Banned
- `useEffect` + `fetch`. If you write one, you are working around the query layer.
- `refetchInterval` for anything but an in-flight sync job.
- Reading `queryClient.getQueryData` inside a component to derive render state — subscribe with a query instead.
- Calling `supabase` from a component.

## Zustand

### Slice shape
One slice per concern, in `src/store/`, each its own file, each under 120 lines.

```ts
/* ── Types ───────────────────────────────────────────── */
export interface TransactionFilterState {
  readonly categoryIds: readonly string[];
  readonly accountIds: readonly string[];
  readonly onlyNeedsReview: boolean;
  setCategoryIds: (ids: readonly string[]) => void;
  toggleNeedsReview: () => void;
  reset: () => void;
}

export const useTransactionFilters = create<TransactionFilterState>()((set) => ({
  categoryIds: [],
  accountIds: [],
  onlyNeedsReview: false,
  setCategoryIds: (categoryIds) => set({ categoryIds }),
  toggleNeedsReview: () => set((s) => ({ onlyNeedsReview: !s.onlyNeedsReview })),
  reset: () => set({ categoryIds: [], accountIds: [], onlyNeedsReview: false }),
}));
```

### Rules
- **Always select narrowly**: `useTransactionFilters((s) => s.onlyNeedsReview)`, never `useTransactionFilters()`. Selecting the whole store re-renders on every change.
- Use `useShallow` for object/array selections.
- Actions live in the store, not in components. A component calls `toggleNeedsReview()`; it never calls `set()`.
- Derived values are computed in a selector or a pure function, never stored.
- Persisted slices use the `persist` middleware with an MMKV storage adapter and an explicit `partialize` — never persist everything.
- No async logic in a store. Async belongs to react-query.
- No cross-slice imports. If two slices need each other, they are one slice.

## The bridge

Filters live in zustand; the query key includes them. That is the entire integration:

```ts
const filters = useTransactionFilters(useShallow(selectFilterPayload));
const { data } = useQuery({
  queryKey: transactionKeys.list(householdId, filters),
  queryFn: () => transactionRepository.list(householdId, filters),
});
```

Changing a filter changes the key, which fetches. No effects, no manual refetch, no subscriptions.
