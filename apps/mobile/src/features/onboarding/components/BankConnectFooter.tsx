import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  cta: 'onboarding.bank_connect.cta',
  statusConnecting: 'onboarding.bank_connect.status_connecting',
  statusFetching: 'onboarding.bank_connect.status_fetching',
  continueCta: 'onboarding.bank_connect.continue_cta',
  manualFallback: 'onboarding.bank_connect.manual_fallback',
} as const;

const TEST_ID = {
  connectButton: 'bank-connect-trigger-button',
  continueButton: 'bank-connect-continue-button',
  skipButton: 'bank-connect-skip-button',
} as const;

export type SyncState = 'idle' | 'connecting' | 'fetching' | 'done';

export interface BankConnectFooterProps {
  readonly syncState: SyncState;
  readonly bankName: string;
  readonly onStart: () => void;
  readonly onContinue: () => void;
}

function BankConnectIdleCta({ bankName, onStart, onSkip }: {
  readonly bankName: string;
  readonly onStart: () => void;
  readonly onSkip: () => void;
}) {
  const t = useT();
  return (
    <>
      <Button
        variant="primary"
        size="lg"
        fullWidth
        label={t(TEXT.cta, { bank: bankName })}
        testID={TEST_ID.connectButton}
        onPress={onStart}
      />
      <Pressable onPress={onSkip} testID={TEST_ID.skipButton} accessibilityRole="button">
        <Text variant="body" color="tertiary" style={{ textAlign: 'center' }}>
          {t(TEXT.manualFallback)}
        </Text>
      </Pressable>
    </>
  );
}

export function BankConnectFooter({ syncState, bankName, onStart, onContinue }: BankConnectFooterProps) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing['20'],
        paddingTop: theme.spacing['12'],
        paddingBottom: Math.max(insets.bottom, theme.spacing['16']),
        backgroundColor: theme.colors.bgCanvas,
        borderTopWidth: 1,
        borderColor: theme.colors.borderSubtle,
        gap: theme.spacing['8'],
      }}
    >
      {syncState === 'idle' && (
        <BankConnectIdleCta bankName={bankName} onStart={onStart} onSkip={onContinue} />
      )}
      {(syncState === 'connecting' || syncState === 'fetching') && (
        <Text variant="title" color="accent" style={{ textAlign: 'center', paddingVertical: theme.spacing['8'] }}>
          {syncState === 'connecting' ? t(TEXT.statusConnecting, { bank: bankName }) : t(TEXT.statusFetching)}
        </Text>
      )}
      {syncState === 'done' && (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          label={t(TEXT.continueCta)}
          testID={TEST_ID.continueButton}
          onPress={onContinue}
        />
      )}
    </View>
  );
}
