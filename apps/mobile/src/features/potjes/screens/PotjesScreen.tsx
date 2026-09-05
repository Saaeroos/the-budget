import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { cents, type Cents } from '@shared';
import { Button, EmptyState, FadeInView, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { useBudgetStore, type LocalEnvelope, type LocalYearlyExpense } from '@/features/budget';
import { PotjesSummaryCard } from '../components/PotjesSummaryCard';
import { PotjeCard } from '../components/PotjeCard';
import { PotjesTabs, type PotjesTab } from '../components/PotjesTabs';
import { YearlyExpensesHero } from '../components/YearlyExpensesHero';
import { YearlyExpenseCard } from '../components/YearlyExpenseCard';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'potjes.title',
  addCta: 'potjes.add_cta',
  emptyTitle: 'potjes.empty_title',
  emptyBody: 'potjes.empty_body',
} as const;

const TEST_ID = {
  screen: 'potjes-screen',
  addButton: 'potjes-add-button',
} as const;

/* ── Sub-components ───────────────────────────────────── */

function EnvelopesList({
  envelopes,
  onPressEnvelope,
  onDeposit,
}: {
  readonly envelopes: readonly LocalEnvelope[];
  readonly onPressEnvelope: (id: string) => void;
  readonly onDeposit: (id: string, amount: Cents) => void;
}) {
  const t = useT();
  const { theme } = useTheme();

  if (envelopes.length === 0) {
    return (
      <EmptyState
        title={t(TEXT.emptyTitle)}
        body={t(TEXT.emptyBody)}
        testID="potjes-empty-state"
      />
    );
  }

  return (
    <View style={{ gap: theme.spacing['12'] }}>
      {envelopes.map((env) => (
        <PotjeCard
          key={env.id}
          envelope={env}
          onPress={() => onPressEnvelope(env.id)}
          onDeposit={() => onDeposit(env.id, cents(5000))}
        />
      ))}
    </View>
  );
}

function YearlyExpensesList({
  expenses,
  envelopes,
}: {
  readonly expenses: readonly LocalYearlyExpense[];
  readonly envelopes: readonly LocalEnvelope[];
}) {
  const { theme } = useTheme();
  const coveredIds = new Set(envelopes.map((e) => e.id));

  return (
    <View style={{ gap: theme.spacing['12'] }}>
      {expenses.map((exp) => {
        const isCovered = exp.linkedEnvelopeId != null && coveredIds.has(exp.linkedEnvelopeId);
        return <YearlyExpenseCard key={exp.id} expense={exp} isCovered={isCovered} />;
      })}
    </View>
  );
}

function PotjesHeader({ onAdd }: { readonly onAdd: () => void }) {
  const t = useT();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text variant="title-lg">{t(TEXT.title)}</Text>
      <Button
        variant="primary"
        size="md"
        label={t(TEXT.addCta)}
        testID={TEST_ID.addButton}
        onPress={onAdd}
      />
    </View>
  );
}

/* ── Screen Component ─────────────────────────────────── */

export function PotjesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<PotjesTab>('all');
  const envelopes = useBudgetStore((s) => s.envelopes);
  const yearlyExpenses = useBudgetStore((s) => s.yearlyExpenses);
  const depositToEnvelope = useBudgetStore((s) => s.depositToEnvelope);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas, paddingTop: insets.top }}>
      <ScrollView
        testID={TEST_ID.screen}
        contentContainerStyle={{
          padding: theme.spacing['20'],
          gap: theme.spacing['16'],
          paddingBottom: insets.bottom + 96,
        }}
      >
        <PotjesHeader onAdd={() => router.push('/modals/potje-nieuw')} />

        <PotjesTabs
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          envelopeCount={envelopes.length}
          yearlyCount={yearlyExpenses.length}
        />

        {activeTab === 'all' ? (
          <FadeInView key="all" index={0} style={{ gap: theme.spacing['16'] }}>
            <PotjesSummaryCard envelopes={envelopes} />
            <EnvelopesList
              envelopes={envelopes}
              onPressEnvelope={(id) => router.push(`/potjes/${id}`)}
              onDeposit={(id, amt) => depositToEnvelope(id, amt)}
            />
          </FadeInView>
        ) : (
          <FadeInView key="yearly" index={0} style={{ gap: theme.spacing['16'] }}>
            <YearlyExpensesHero expenses={yearlyExpenses} />
            <YearlyExpensesList expenses={yearlyExpenses} envelopes={envelopes} />
          </FadeInView>
        )}
      </ScrollView>
    </View>
  );
}

