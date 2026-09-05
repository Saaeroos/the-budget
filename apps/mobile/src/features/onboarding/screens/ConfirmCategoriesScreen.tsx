import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { cents, type Cents } from '@shared';
import { Button, Card, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { useConfirmedCategories, useOnboardingStore } from '../store/useOnboardingStore';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'onboarding.categories.title',
  subtitle: 'onboarding.categories.subtitle',
  totalLabel: 'onboarding.categories.total_label',
  perMonth: 'onboarding.categories.per_month',
  rentMortgage: 'onboarding.categories.rent_mortgage',
  healthInsurance: 'onboarding.categories.health_insurance',
  energyWater: 'onboarding.categories.energy_water',
  internetTv: 'onboarding.categories.internet_tv',
  taxes: 'onboarding.categories.taxes',
  streaming: 'onboarding.categories.streaming',
  continueCta: 'onboarding.categories.continue_cta',
} as const;

const TEST_ID = {
  screen: 'confirm-categories-screen',
  continueButton: 'categories-continue-button',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface RecurringItem {
  readonly id: string;
  readonly titleKey: string;
  readonly cents: Cents;
}

const RECURRING_ITEMS: readonly RecurringItem[] = [
  { id: 'rent_mortgage', titleKey: TEXT.rentMortgage, cents: cents(95000) },
  { id: 'health_insurance', titleKey: TEXT.healthInsurance, cents: cents(14500) },
  { id: 'energy_water', titleKey: TEXT.energyWater, cents: cents(18500) },
  { id: 'internet_tv', titleKey: TEXT.internetTv, cents: cents(5500) },
  { id: 'taxes', titleKey: TEXT.taxes, cents: cents(6500) },
  { id: 'streaming', titleKey: TEXT.streaming, cents: cents(1800) },
];

interface ChecklistProps {
  readonly confirmedCategories: readonly string[];
  readonly onToggle: (id: string) => void;
}

/* ── Sub-components ───────────────────────────────────── */

function TotalSummaryCard({ totalCents }: { readonly totalCents: Cents }) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <Card>
      <Text variant="label" color="secondary">
        {t(TEXT.totalLabel)}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing['8'] }}>
        <Money cents={totalCents} variant="title-lg" />
        <Text variant="body" color="secondary">
          {t(TEXT.perMonth)}
        </Text>
      </View>
    </Card>
  );
}

function CategoryChecklist({ confirmedCategories, onToggle }: ChecklistProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View style={{ gap: theme.spacing['8'] }}>
      {RECURRING_ITEMS.map((item) => {
        const isSelected = confirmedCategories.includes(item.id);
        return (
          <Pressable
            key={item.id}
            testID={`category-item-${item.id}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            onPress={() => onToggle(item.id)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: isSelected ? theme.colors.bgSurfaceRaised : theme.colors.bgSubtle,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: isSelected ? theme.colors.accentBg : theme.colors.borderSubtle,
              padding: theme.spacing['16'],
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing['12'] }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: theme.radius.sm,
                  borderWidth: 2,
                  borderColor: isSelected ? theme.colors.accentBg : theme.colors.borderStrong,
                  backgroundColor: isSelected ? theme.colors.accentBg : 'transparent',
                }}
              />
              <Text variant="body">{t(item.titleKey)}</Text>
            </View>
            <Money cents={item.cents} variant="body" />
          </Pressable>
        );
      })}
    </View>
  );
}

function ConfirmCategoriesFooter({ onContinue }: { readonly onContinue: () => void }) {
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

export function ConfirmCategoriesScreen() {
  const t = useT();
  const router = useRouter();
  const { theme } = useTheme();
  const confirmedCategories = useConfirmedCategories();
  const toggleCategory = useOnboardingStore((s) => s.toggleCategory);
  const setStep = useOnboardingStore((s) => s.setStep);

  const totalRaw = RECURRING_ITEMS.reduce((sum, item) => {
    return confirmedCategories.includes(item.id) ? sum + item.cents : sum;
  }, 0);

  const handleContinue = (): void => {
    setStep(5);
    router.push('/(onboarding)/eerste-potje');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }}>
      <ScrollView
        testID={TEST_ID.screen}
        contentContainerStyle={{
          padding: theme.spacing['20'],
          gap: theme.spacing['16'],
          paddingBottom: theme.spacing['20'],
        }}
      >
        <View style={{ gap: theme.spacing['8'] }}>
          <Text variant="title-lg">{t(TEXT.title)}</Text>
          <Text variant="body" color="secondary">
            {t(TEXT.subtitle)}
          </Text>
        </View>
        <TotalSummaryCard totalCents={cents(totalRaw)} />
        <CategoryChecklist confirmedCategories={confirmedCategories} onToggle={toggleCategory} />
      </ScrollView>
      <ConfirmCategoriesFooter onContinue={handleContinue} />
    </View>
  );
}
