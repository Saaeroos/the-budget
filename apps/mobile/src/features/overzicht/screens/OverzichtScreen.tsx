import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInView, SegmentedControl, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { ScopeHeaderPill, useBudgetStore, useFilteredTransactions, useFreelanceTaxSummary } from '@/features/budget';
import { BucketBreakdownCard } from '../components/BucketBreakdownCard';
import { IncomeVsExpenseCard } from '../components/IncomeVsExpenseCard';
import { TopCategoriesCard } from '../components/TopCategoriesCard';
import { FreelanceHeroCard } from '../components/FreelanceHeroCard';
import { BtwQuarterCard } from '../components/BtwQuarterCard';
import { IncomeTaxCard } from '../components/IncomeTaxCard';
import { BusinessDeductionsNavCard } from '../components/BusinessDeductionsNavCard';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'overzicht.title',
  currentPeriod: 'overzicht.current_period',
  tabPersonal: 'freelance.tab_personal',
  tabBusiness: 'freelance.tab_business',
} as const;

const TEST_ID = {
  screen: 'overzicht-screen',
} as const;

/* ── Sub-components ───────────────────────────────────── */

export type OverzichtTab = 'personal' | 'business';

function OverzichtTabs({
  activeTab,
  onSelectTab,
}: {
  readonly activeTab: OverzichtTab;
  readonly onSelectTab: (tab: OverzichtTab) => void;
}) {
  const t = useT();
  const options = [
    { value: 'personal' as const, label: t(TEXT.tabPersonal), testID: 'overzicht-tab-personal' },
    { value: 'business' as const, label: t(TEXT.tabBusiness), testID: 'overzicht-tab-business' },
  ];

  return (
    <SegmentedControl
      testID="overzicht-scope-tabs"
      value={activeTab}
      onChange={onSelectTab}
      options={options}
    />
  );
}

/* ── Screen Component ─────────────────────────────────── */

export function OverzichtScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [tab, setTab] = useState<OverzichtTab>('personal');
  const transactions = useFilteredTransactions();
  const periodLabel = useBudgetStore((s) => s.periodLabel);
  const freelanceTax = useFreelanceTaxSummary();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas, paddingTop: insets.top }}>
      <ScrollView
        testID={TEST_ID.screen}
        contentContainerStyle={{
          padding: theme.spacing['20'],
          gap: theme.spacing['20'],
          paddingBottom: insets.bottom + 96,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ gap: theme.spacing['4'] }}>
            <Text variant="title-lg">{t(TEXT.title)}</Text>
            <Text variant="label" color="secondary">
              {t(TEXT.currentPeriod)}: {periodLabel}
            </Text>
          </View>
          <ScopeHeaderPill />
        </View>

        <OverzichtTabs activeTab={tab} onSelectTab={setTab} />

        {tab === 'personal' ? (
          <FadeInView key="personal" index={0} style={{ gap: theme.spacing['20'] }}>
            <BucketBreakdownCard transactions={transactions} />
            <IncomeVsExpenseCard transactions={transactions} />
            <TopCategoriesCard transactions={transactions} />
          </FadeInView>
        ) : (
          <FadeInView key="business" index={0} style={{ gap: theme.spacing['20'] }}>
            <FreelanceHeroCard summary={freelanceTax} />
            <BtwQuarterCard summary={freelanceTax} />
            <IncomeTaxCard summary={freelanceTax} />
            <BusinessDeductionsNavCard />
          </FadeInView>
        )}
      </ScrollView>
    </View>
  );
}
