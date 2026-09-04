import { useEffect, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { createSupabaseOutboxGateway, flushOutbox } from '@/lib/sync';
import { useDatabase } from './DatabaseProvider';

/* ── Text ─────────────────────────────────────────────── */
// (none — no user-facing or logged strings)

/* ── Types ────────────────────────────────────────────── */

export interface SyncProviderProps {
  readonly children: ReactNode;
}

const LIMITS = {
  /** `docs/13` §6 — flush at least once a minute while the app is active. */
  flushIntervalMs: 60_000,
} as const;

/* ── Implementation ───────────────────────────────────── */

/**
 * Flushes the outbox on app foreground, after every mutation, and on a
 * 60s timer (`docs/13` §6). True reconnect-triggered flushing needs
 * `@react-native-community/netinfo`, which is not in the approved stack
 * (`CLAUDE.md` §2) — see `docs/DECISIONS.md` for the gap this leaves and
 * why the other three triggers cover it well enough for now.
 */
export function SyncProvider({ children }: SyncProviderProps) {
  const { db } = useDatabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    const gateway = createSupabaseOutboxGateway(db);
    const flush = (): void => {
      void flushOutbox({ gateway, now: () => new Date() });
    };

    flush();

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') flush();
    });
    const intervalId = setInterval(flush, LIMITS.flushIntervalMs);
    const unsubscribeMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === 'updated' && event.mutation.state.status === 'success') flush();
    });

    return () => {
      appStateSubscription.remove();
      clearInterval(intervalId);
      unsubscribeMutations();
    };
  }, [db, queryClient]);

  return <>{children}</>;
}
