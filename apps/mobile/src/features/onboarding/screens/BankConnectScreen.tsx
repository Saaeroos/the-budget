import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BankConnectSvg, Card, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { BankConnectFooter, type SyncState } from '../components/BankConnectFooter';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'onboarding.bank_connect.title',
  whatHappens: 'onboarding.bank_connect.what_happens',
  bullet1: 'onboarding.bank_connect.bullet_1',
  bullet2: 'onboarding.bank_connect.bullet_2',
  bullet3: 'onboarding.bank_connect.bullet_3',
  statusDetected: 'onboarding.bank_connect.status_detected',
} as const;

const TEST_ID = {
  screen: 'bank-connect-screen',
} as const;

/* ── Types ────────────────────────────────────────────── */

const BANK_NAMES: Record<string, string> = {
  ing: 'ING',
  rabobank: 'Rabobank',
  abnamro: 'ABN AMRO',
  bunq: 'bunq',
  sns: 'SNS',
  asnbank: 'ASN Bank',
  regiobank: 'RegioBank',
  triodos: 'Triodos Bank',
};

/* ── Sub-components ───────────────────────────────────── */

function BankConnectHeader({ bankName }: { readonly bankName: string }) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <>
      <View style={{ alignItems: 'center', marginVertical: theme.spacing['12'] }}>
        <BankConnectSvg size={100} />
      </View>
      <Text variant="title-lg">{t(TEXT.title, { bank: bankName })}</Text>
    </>
  );
}

function BankExplainerCard() {
  const t = useT();
  const { theme } = useTheme();

  const chips = [t(TEXT.bullet1), t(TEXT.bullet2), t(TEXT.bullet3)];

  return (
    <View style={{ width: '100%', gap: theme.spacing['12'] }}>
      <Text variant="title" style={{ textAlign: 'center' }}>
        {t(TEXT.whatHappens)}
      </Text>
      <View style={{ gap: theme.spacing['8'] }}>
        {chips.map((chip, idx) => (
          <View
            key={idx}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing['12'],
              backgroundColor: theme.colors.bgSurface,
              borderWidth: 1,
              borderColor: theme.colors.borderSubtle,
              borderRadius: theme.radius.lg,
              paddingVertical: theme.spacing['12'],
              paddingHorizontal: theme.spacing['16'],
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.accentBg,
              }}
            />
            <Text variant="body" color="secondary" style={{ flex: 1 }}>
              {chip}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function DetectedCard({ label }: { readonly label: string }) {
  return (
    <Card padded>
      <Text variant="title" color="accent" style={{ textAlign: 'center' }}>
        {label}
      </Text>
    </Card>
  );
}

/* ── Screen Component ─────────────────────────────────── */

export function BankConnectScreen() {
  const t = useT();
  const router = useRouter();
  const { theme } = useTheme();
  const { institutionId } = useLocalSearchParams<{ institutionId?: string }>();
  const setStep = useOnboardingStore((s) => s.setStep);
  const [syncState, setSyncState] = useState<SyncState>('idle');

  const bankName = BANK_NAMES[institutionId ?? ''] ?? 'je bank';

  const handleStart = (): void => {
    setSyncState('connecting');
    setTimeout(() => {
      setSyncState('fetching');
      setTimeout(() => setSyncState('done'), 700);
    }, 700);
  };

  const handleContinue = (): void => {
    setStep(4);
    router.push('/(onboarding)/categorieen');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }}>
      <ScrollView
        testID={TEST_ID.screen}
        contentContainerStyle={{
          padding: theme.spacing['20'],
          gap: theme.spacing['20'],
          paddingBottom: theme.spacing['20'],
          alignItems: 'center',
        }}
      >
        <BankConnectHeader bankName={bankName} />
        <BankExplainerCard />
        {syncState === 'done' && <DetectedCard label={t(TEXT.statusDetected)} />}
      </ScrollView>
      <BankConnectFooter
        syncState={syncState}
        bankName={bankName}
        onStart={handleStart}
        onContinue={handleContinue}
      />
    </View>
  );
}
