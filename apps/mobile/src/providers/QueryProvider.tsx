import { useState, type ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { queryCacheStorage, toAsyncKeyValueStore } from '@/lib/storage';

/* ── Text ─────────────────────────────────────────────── */
// (none — no user-facing or logged strings)

/* ── Types ────────────────────────────────────────────── */

export interface QueryProviderProps {
  readonly children: ReactNode;
}

const LIMITS = {
  /** `docs/13` §3. */
  staleTimeMs: 60_000,
  gcTimeMs: 24 * 60 * 60 * 1000,
  retry: 2,
  persistKey: 'kwartje.query-cache',
} as const;

/* ── Implementation ───────────────────────────────────── */

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: LIMITS.staleTimeMs,
        gcTime: LIMITS.gcTimeMs,
        retry: LIMITS.retry,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        throwOnError: false,
      },
    },
  });
}

/**
 * The single `QueryClient` for the app, persisted to MMKV so a cold start
 * shows the last-known data before the network round-trip completes
 * (`docs/13` §2/§3). Every read still goes through SQLite first
 * (`docs/13` §5) — this cache is an optimisation on top of that, not a
 * replacement for it.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [client] = useState(createQueryClient);
  const [persister] = useState(() =>
    createAsyncStoragePersister({
      storage: toAsyncKeyValueStore(queryCacheStorage),
      key: LIMITS.persistKey,
    }),
  );

  return (
    <PersistQueryClientProvider client={client} persistOptions={{ persister, maxAge: LIMITS.gcTimeMs }}>
      {children}
    </PersistQueryClientProvider>
  );
}
