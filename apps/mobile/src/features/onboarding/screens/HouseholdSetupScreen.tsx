import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Card, SegmentedControl, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { useHouseholdData, useOnboardingStore, type HouseholdComposition, type IncomeCadence } from '../store/useOnboardingStore';
import { ChildrenStepper } from '../components/ChildrenStepper';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'onboarding.huishouden.title',
  subtitle: 'onboarding.huishouden.subtitle',
  compositionLabel: 'onboarding.huishouden.composition_label',
  single: 'onboarding.huishouden.single',
  partner: 'onboarding.huishouden.partner',
  family: 'onboarding.huishouden.family',
  childrenCount: 'onboarding.huishouden.children_count',
  incomeLabel: 'onboarding.huishouden.income_rhythm_label',
  calendarMonth: 'onboarding.huishouden.calendar_month',
  fixedDay: 'onboarding.huishouden.fixed_day',
  fourWeeks: 'onboarding.huishouden.four_weeks',
  hasAccount: 'onboarding.huishouden.has_account',
  loginLink: 'onboarding.huishouden.login_link',
  next: 'common.next',
} as const;

const TEST_ID = {
  screen: 'household-setup-screen',
  composition: 'household-composition-control',
  cadence: 'household-cadence-control',
  childrenMinus: 'household-children-minus',
  childrenPlus: 'household-children-plus',
  nextButton: 'household-next-button',
  loginLink: 'household-login-link',
} as const;

/* ── Types ────────────────────────────────────────────── */

type CompositionOption = HouseholdComposition;
type CadenceOption = IncomeCadence;

interface CompositionCardProps {
  readonly composition: CompositionOption;
  readonly childrenCount: number;
  readonly onCompositionChange: (val: CompositionOption) => void;
  readonly onChildrenChange: (val: number) => void;
}

interface IncomeCardProps {
  readonly cadence: CadenceOption;
  readonly onCadenceChange: (val: CadenceOption) => void;
}

/* ── Sub-components ───────────────────────────────────── */

function CompositionCard({
  composition,
  childrenCount,
  onCompositionChange,
  onChildrenChange,
}: CompositionCardProps) {
  const t = useT();

  return (
    <Card>
      <Text variant="label" color="secondary">
        {t(TEXT.compositionLabel)}
      </Text>
      <SegmentedControl<CompositionOption>
        testID={TEST_ID.composition}
        value={composition}
        onChange={onCompositionChange}
        options={[
          { value: 'single', label: t(TEXT.single), testID: 'composition-single' },
          { value: 'partner', label: t(TEXT.partner), testID: 'composition-partner' },
          { value: 'family', label: t(TEXT.family), testID: 'composition-family' },
        ]}
      />
      {composition === 'family' && <ChildrenStepper count={childrenCount} onChange={onChildrenChange} />}
    </Card>
  );
}

function IncomeCard({ cadence, onCadenceChange }: IncomeCardProps) {
  const t = useT();
  return (
    <Card>
      <Text variant="label" color="secondary">
        {t(TEXT.incomeLabel)}
      </Text>
      <SegmentedControl<CadenceOption>
        testID={TEST_ID.cadence}
        value={cadence}
        onChange={onCadenceChange}
        options={[
          { value: 'calendar_month', label: t(TEXT.calendarMonth), testID: 'cadence-month' },
          { value: 'custom_month', label: t(TEXT.fixedDay, { day: 24 }), testID: 'cadence-day' },
          { value: 'four_weeks', label: t(TEXT.fourWeeks), testID: 'cadence-4weeks' },
        ]}
      />
    </Card>
  );
}

function HouseholdActions({ onNext, onLogin }: { readonly onNext: () => void; readonly onLogin: () => void }) {
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
        gap: theme.spacing['12'],
      }}
    >
      <Button
        variant="primary"
        size="lg"
        fullWidth
        label={t(TEXT.next)}
        testID={TEST_ID.nextButton}
        onPress={onNext}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.spacing['4'] }}>
        <Text variant="body" color="secondary">
          {t(TEXT.hasAccount)}
        </Text>
        <Pressable onPress={onLogin} testID={TEST_ID.loginLink} accessibilityRole="button">
          <Text variant="body" color="accent">
            {t(TEXT.loginLink)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ── Screen Component ─────────────────────────────────── */

export function HouseholdSetupScreen() {
  const t = useT();
  const router = useRouter();
  const { theme } = useTheme();
  const household = useHouseholdData();
  const setHousehold = useOnboardingStore((s) => s.setHousehold);
  const setStep = useOnboardingStore((s) => s.setStep);

  const [composition, setComposition] = useState<CompositionOption>(household.composition);
  const [children, setChildren] = useState<number>(household.children);
  const [incomeCadence, setIncomeCadence] = useState<CadenceOption>(household.incomeCadence);

  const handleNext = (): void => {
    setHousehold({ composition, children: composition === 'family' ? Math.max(children, 1) : 0, incomeCadence });
    setStep(2);
    router.push('/(onboarding)/bank');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }}>
      <ScrollView
        testID={TEST_ID.screen}
        contentContainerStyle={{
          padding: theme.spacing['20'],
          gap: theme.spacing['24'],
          paddingBottom: theme.spacing['20'],
        }}
      >
        <View style={{ gap: theme.spacing['8'] }}>
          <Text variant="title-lg">{t(TEXT.title)}</Text>
          <Text variant="body" color="secondary">
            {t(TEXT.subtitle)}
          </Text>
        </View>
        <CompositionCard
          composition={composition}
          childrenCount={children}
          onCompositionChange={setComposition}
          onChildrenChange={setChildren}
        />
        <IncomeCard cadence={incomeCadence} onCadenceChange={setIncomeCadence} />
      </ScrollView>
      <HouseholdActions onNext={handleNext} onLogin={() => router.push('/(auth)/inloggen')} />
    </View>
  );
}
