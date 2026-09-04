import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/ui';
import { I18nProvider } from '@/i18n';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { AppLockGate } from '@/providers/AppLockGate';
import { DatabaseProvider } from '@/providers/DatabaseProvider';
import { SyncProvider } from '@/providers/SyncProvider';
import { DevBanner } from '@/providers/DevBanner';

/* ── Text ─────────────────────────────────────────────── */
// (none — route composition only)

/* ── Types ────────────────────────────────────────────── */
// (none)

/* ── Implementation ───────────────────────────────────── */

const rootStackScreenOptions = ({ route }: { route: { name: string } }) => ({
  headerShown: false,
  presentation: route.name.startsWith('modals/') ? ('modal' as const) : undefined,
});

/**
 * `docs/05` §2 route tree, gated by session (`docs/24` §2: the dev bypass
 * signs in before this ever renders, so it takes the same authenticated
 * branch as a real user — the bypass skips `(auth)`, not the authorisation).
 */
function RootNavigator() {
  const { isLoading, session } = useAuth();
  if (isLoading) return null;

  return (
    <>
      <DevBanner />
      <Stack screenOptions={rootStackScreenOptions}>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="budget" />
          <Stack.Screen name="rekeningen" />
          <Stack.Screen name="abonnementen" />
          <Stack.Screen name="splits" />
          <Stack.Screen name="instellingen" />
          <Stack.Screen name="modals" />
        </Stack.Protected>
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

/** Provider order per `docs/13` §2 — theme before i18n, auth before the
 * database (it is scoped per user), sync last. */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <ThemeProvider>
            <I18nProvider>
              <AuthProvider>
                <AppLockGate>
                  <DatabaseProvider>
                    <SyncProvider>
                      <BottomSheetModalProvider>
                        <RootNavigator />
                      </BottomSheetModalProvider>
                    </SyncProvider>
                  </DatabaseProvider>
                </AppLockGate>
              </AuthProvider>
            </I18nProvider>
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
