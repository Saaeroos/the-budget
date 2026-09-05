import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AppError, ERROR_CODE } from '@/lib/errors';
import { devAuth, DEV_FIXTURE_HOUSEHOLDS } from '@/lib/devAuth';
import { useDevActiveFixtureHouseholdId } from '@/store/devStore';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  missingHousehold: 'AuthProvider: useHousehold() called before a household is known',
  missingProvider: 'AuthProvider: useAuth() called outside <AuthProvider>',
} as const;

/* ── Types ────────────────────────────────────────────── */

export interface AuthContextValue {
  readonly session: Session | null;
  readonly userId: string | null;
  /** `null` until the signed-in user's household resolves. Always set
   * immediately in a dev build (`docs/24` §2/§4). */
  readonly householdId: string | null;
  readonly isLoading: boolean;
  readonly isDevBypass: boolean;
  readonly signOut: () => Promise<void>;
}

export interface AuthProviderProps {
  readonly children: ReactNode;
}

/* ── Implementation ───────────────────────────────────── */

const AuthContext = createContext<AuthContextValue | null>(null);

function fixtureEmailFor(householdId: string): string {
  return DEV_FIXTURE_HOUSEHOLDS.find((h) => h.householdId === householdId)?.email ?? devAuth.email;
}

function createLocalDevSession(householdId: string): Session {
  return {
    access_token: 'local-dev-token',
    refresh_token: 'local-dev-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: devAuth.userId,
      app_metadata: {},
      user_metadata: { household_id: householdId },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    },
  };
}

/** Signs into the **local** Supabase with the seeded fixture account for the
 * currently selected dev household, or falls back to a local session when
 * Supabase is not running. */
async function signInDevFixture(householdId: string): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: fixtureEmailFor(householdId),
      password: devAuth.password,
    });
    if (!error && data?.session) return data.session;
  } catch {
    // Offline / Supabase not running: fall back to local dev session
  }
  return createLocalDevSession(householdId);
}

function useSessionBootstrap(devHouseholdId: string): { session: Session | null; isLoading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      setIsLoading(true);
      try {
        let next: Session | null = null;
        if (devAuth.enabled) {
          next = await signInDevFixture(devHouseholdId);
        } else {
          const res = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          next = res.data.session;
        }
        if (!cancelled) {
          setSession(next ?? (devAuth.enabled ? createLocalDevSession(devHouseholdId) : null));
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setSession(devAuth.enabled ? createLocalDevSession(devHouseholdId) : null);
          setIsLoading(false);
        }
      }
    }
    void bootstrap();
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!cancelled) setSession(next);
    });
    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [devHouseholdId]);

  return { session, isLoading };
}

/**
 * Owns the Supabase session and its refresh (`docs/13` §2). In a dev build
 * it signs into the local Supabase project with a seeded fixture account
 * instead of rendering `(auth)` — the bypass skips the screen, never the
 * authorisation (`docs/24` §2).
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const devHouseholdId = useDevActiveFixtureHouseholdId();
  const { session, isLoading } = useSessionBootstrap(devHouseholdId);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      userId: session?.user.id ?? null,
      householdId: devAuth.enabled ? devHouseholdId : null,
      isLoading,
      isDevBypass: devAuth.enabled,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, isLoading, devHouseholdId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new AppError(ERROR_CODE.internal, TEXT.missingProvider);
  return value;
}

/** Convenience accessor for the household-scoped query key factories
 * (`docs/13` §3). Throws if called before the household resolves — every
 * screen under `(tabs)` renders only once `AuthProvider` is past loading. */
export function useHousehold(): { householdId: string } {
  const { householdId } = useAuth();
  if (!householdId) throw new AppError(ERROR_CODE.internal, TEXT.missingHousehold);
  return { householdId };
}
