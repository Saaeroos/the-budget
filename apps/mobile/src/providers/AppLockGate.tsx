import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, View, type AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { BlurView } from 'expo-blur';
import { Lock } from 'lucide-react-native';
import { EmptyState, useTheme } from '@/ui';
import { useT } from '@/i18n';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'security.locked_title',
  body: 'security.locked_body',
  cta: 'security.unlock_cta',
  prompt: 'security.unlock_prompt',
} as const;

const TEST_ID = {
  lockOverlay: 'app-lock-overlay',
  blurOverlay: 'app-lock-blur-overlay',
  unlockButton: 'app-lock-unlock-button',
} as const;

/* ── Types ────────────────────────────────────────────── */

export interface AppLockGateProps {
  readonly children: ReactNode;
}

const LIMITS = {
  /** `docs/24`/CLAUDE.md §8: re-lock after 5 minutes in the background. */
  backgroundTimeoutMs: 5 * 60 * 1000,
} as const;

/* ── Implementation ───────────────────────────────────── */

async function isBiometricLockAvailable(): Promise<boolean> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && isEnrolled;
}

function useBackgroundRelock(available: boolean, onRelock: () => void): AppStateStatus {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const backgroundedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      setAppState(next);
      if (next === 'active') {
        const backgroundedAt = backgroundedAtRef.current;
        backgroundedAtRef.current = null;
        if (available && backgroundedAt !== null && Date.now() - backgroundedAt > LIMITS.backgroundTimeoutMs) {
          onRelock();
        }
      } else {
        backgroundedAtRef.current = Date.now();
      }
    });
    return () => subscription.remove();
  }, [available, onRelock]);

  return appState;
}

/**
 * Biometric gate at cold start and after 5 minutes backgrounded
 * (`.claude/rules/08-security.md`: on by default, never bypassable by
 * backgrounding during the prompt). Also blurs `children` behind an
 * `expo-blur` overlay whenever the app is not foregrounded, so the OS
 * app-switcher snapshot never shows a balance or a transaction.
 */
export function AppLockGate({ children }: AppLockGateProps) {
  const { theme } = useTheme();
  const t = useT();
  const [isLocked, setIsLocked] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const relock = useCallback(() => setIsLocked(true), []);
  const appState = useBackgroundRelock(isAvailable, relock);

  useEffect(() => {
    let mounted = true;
    void isBiometricLockAvailable().then((available) => {
      if (!mounted) return;
      setIsAvailable(available);
      setIsLocked(available);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleUnlock = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: t(TEXT.prompt) });
    if (result.success) setIsLocked(false);
  }, [t]);

  return (
    <View style={styles.flex}>
      {children}
      {appState !== 'active' ? (
        <BlurView testID={TEST_ID.blurOverlay} intensity={100} tint="default" style={StyleSheet.absoluteFill} />
      ) : null}
      {isLocked ? (
        <View
          testID={TEST_ID.lockOverlay}
          style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: theme.colors.bgCanvas }]}
        >
          <EmptyState
            icon={Lock}
            title={t(TEXT.title)}
            body={t(TEXT.body)}
            action={{ label: t(TEXT.cta), onPress: handleUnlock, testID: TEST_ID.unlockButton }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { alignItems: 'center', justifyContent: 'center' },
});
