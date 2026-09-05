import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { cents, type Cents } from '@shared';
import { Button, Card, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { useFirstEnvelope, useOnboardingStore } from '../store/useOnboardingStore';
import { JarOptionsList, type PresetJar } from '../components/JarOptionsList';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'onboarding.first_envelope.title',
  subtitle: 'onboarding.first_envelope.subtitle',
  car: 'onboarding.first_envelope.car',
  carDesc: 'onboarding.first_envelope.car_desc',
  vacation: 'onboarding.first_envelope.vacation',
  vacationDesc: 'onboarding.first_envelope.vacation_desc',
  buffer: 'onboarding.first_envelope.buffer',
  bufferDesc: 'onboarding.first_envelope.buffer_desc',
  monthlyPreview: 'onboarding.first_envelope.monthly_preview',
  continueCta: 'onboarding.first_envelope.continue_cta',
} as const;

const TEST_ID = {
  screen: 'first-envelope-screen',
  continueButton: 'envelope-continue-button',
} as const;

/* ── Types ────────────────────────────────────────────── */

const DEFAULT_JAR: PresetJar = {
  id: 'car_insurance',
  titleKey: TEXT.car,
  descKey: TEXT.carDesc,
  targetCents: cents(48000),
  monthlyCents: cents(4000),
  iconType: 'car',
};

const PRESET_JARS: readonly [PresetJar, ...PresetJar[]] = [
  DEFAULT_JAR,
  {
    id: 'vacation',
    titleKey: TEXT.vacation,
    descKey: TEXT.vacationDesc,
    targetCents: cents(120000),
    monthlyCents: cents(15000),
    iconType: 'vacation',
  },
  {
    id: 'emergency_buffer',
    titleKey: TEXT.buffer,
    descKey: TEXT.bufferDesc,
    targetCents: cents(100000),
    monthlyCents: cents(5000),
    iconType: 'buffer',
  },
];

/* ── Sub-components ───────────────────────────────────── */

function JarPreviewCard({ monthlyCents }: { readonly monthlyCents: Cents }) {
  const t = useT();
  return (
    <Card padded>
      <Text variant="body" color="secondary">
        {t(TEXT.monthlyPreview, { amount: '' })}
      </Text>
      <Money cents={monthlyCents} variant="title-lg" />
    </Card>
  );
}

function FirstEnvelopeFooter({ onContinue }: { readonly onContinue: () => void }) {
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
      }}
    >
      <Button
        variant="primary"
        size="lg"
        fullWidth
        label={t(TEXT.continueCta)}
        testID={TEST_ID.continueButton}
        onPress={onContinue}
      />
    </View>
  );
}

/* ── Screen Component ─────────────────────────────────── */

export function FirstEnvelopeScreen() {
  const t = useT();
  const router = useRouter();
  const { theme } = useTheme();
  const savedEnvelope = useFirstEnvelope();
  const setFirstEnvelope = useOnboardingStore((s) => s.setFirstEnvelope);
  const setStep = useOnboardingStore((s) => s.setStep);

  const [selectedJarId, setSelectedJarId] = useState<string>(savedEnvelope?.id ?? DEFAULT_JAR.id);
  const selectedJar = PRESET_JARS.find((j) => j.id === selectedJarId) ?? DEFAULT_JAR;

  const handleContinue = (): void => {
    setFirstEnvelope({
      id: selectedJar.id,
      name: t(selectedJar.titleKey),
      targetCents: selectedJar.targetCents,
      monthlyCents: selectedJar.monthlyCents,
      icon: selectedJar.iconType,
    });
    setStep(6);
    router.push('/(onboarding)/account');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }}>
      <ScrollView
        testID={TEST_ID.screen}
        contentContainerStyle={{
          padding: theme.spacing['20'],
          gap: theme.spacing['20'],
          paddingBottom: theme.spacing['20'],
        }}
      >
        <View style={{ gap: theme.spacing['8'] }}>
          <Text variant="title-lg">{t(TEXT.title)}</Text>
          <Text variant="body" color="secondary">
            {t(TEXT.subtitle)}
          </Text>
        </View>
        <JarOptionsList jars={PRESET_JARS} selectedId={selectedJarId} onSelect={setSelectedJarId} />
        <JarPreviewCard monthlyCents={selectedJar.monthlyCents} />
      </ScrollView>
      <FirstEnvelopeFooter onContinue={handleContinue} />
    </View>
  );
}
