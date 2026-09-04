import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createDatabaseClient, type DatabaseClient } from '@/db/client';
import { runMigrations } from '@/db/migrate';
import { devAuth } from '@/lib/devAuth';
import { AppError, ERROR_CODE } from '@/lib/errors';
import { useDevActiveFixtureHouseholdId } from '@/store/devStore';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  missingProvider: 'DatabaseProvider: useDatabase() called outside <DatabaseProvider>',
} as const;

/* ── Types ────────────────────────────────────────────── */

export interface DatabaseProviderProps {
  readonly children: ReactNode;
}

/* ── Implementation ───────────────────────────────────── */

const DatabaseContext = createContext<DatabaseClient | null>(null);

/** In a dev build each fixture household (`docs/24` §4) gets its own local
 * mirror file, so the user-switcher never mixes Sanne's data with Bram &
 * Fleur's. Production always uses the single per-install database. */
function databaseNameFor(devHouseholdId: string): string {
  return devAuth.enabled ? `kwartje-${devHouseholdId}.db` : 'kwartje.db';
}

/**
 * Opens the on-device SQLite mirror and runs pending migrations
 * synchronously, before `children` ever render (`docs/13` §5) — there is no
 * loading flicker because `expo-sqlite`'s sync API makes this a single
 * render-time computation, not an effect.
 */
export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const devHouseholdId = useDevActiveFixtureHouseholdId();
  const name = databaseNameFor(devHouseholdId);

  const client = useMemo(() => {
    const created = createDatabaseClient(name);
    runMigrations(created.native);
    return created;
  }, [name]);

  return <DatabaseContext.Provider value={client}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): DatabaseClient {
  const value = useContext(DatabaseContext);
  if (!value) throw new AppError(ERROR_CODE.internal, TEXT.missingProvider);
  return value;
}
