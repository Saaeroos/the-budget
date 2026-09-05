import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { KwartjeMarkSvg, ProgressBar, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { useCurrentStep } from '@/features/onboarding';

import { devAuth } from '@/lib/devAuth';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  back: 'common.back',
  stepCounter: 'onboarding.step_counter',
  a11yProgress: 'onboarding.a11y_progress',
} as const;

const TEST_ID = {
  backButton: 'onboarding-back-button',
  progress: 'onboarding-progress-bar',
} as const;

/* ── Implementation ───────────────────────────────────── */

const TOTAL_STEPS = 6;

interface OnboardingHeaderProps {
  readonly currentStep: number;
  readonly onBack: () => void;
}

function OnboardingHeader({ currentStep, onBack }: OnboardingHeaderProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing['16'],
        paddingVertical: theme.spacing['12'],
      }}
    >
      <View style={{ width: 64 }}>
        {currentStep > 1 && (
          <Pressable onPress={onBack} testID={TEST_ID.backButton} accessibilityRole="button">
            <Text variant="label" color="accent">
              {t(TEXT.back)}
            </Text>
          </Pressable>
        )}
      </View>

      <KwartjeMarkSvg size={28} />

      <View style={{ width: 64, alignItems: 'flex-end' }}>
        <Text variant="label" color="secondary">
          {t(TEXT.stepCounter, { step: currentStep, total: TOTAL_STEPS })}
        </Text>
      </View>
    </View>
  );
}

export default function OnboardingLayout() {
  const t = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const currentStep = useCurrentStep();

  const handleBack = (): void => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bgCanvas,
        paddingTop: devAuth.enabled ? 0 : insets.top,
      }}
    >
      <OnboardingHeader currentStep={currentStep} onBack={handleBack} />

      <View style={{ paddingHorizontal: theme.spacing['16'], paddingBottom: theme.spacing['8'] }}>
        <ProgressBar
          testID={TEST_ID.progress}
          value={currentStep}
          max={TOTAL_STEPS}
          accessibilityLabel={t(TEXT.a11yProgress, { step: currentStep, total: TOTAL_STEPS })}
        />
      </View>

      <Stack screenOptions={{ headerShown: false }} initialRouteName="huishouden" />
    </View>
  );
}
