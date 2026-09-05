import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { allQuartersForYear, computeBtwAangifte, nlDate, quarterByNumber, type BusinessTransaction, type QuarterNumber } from '@shared';
import { BottomBackButton, FadeInView, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { useBudgetStore, type LocalTransaction } from '@/features/budget';
import { QuarterSelector } from '../components/QuarterSelector';
import { RubriekenBreakdownCard } from '../components/RubriekenBreakdownCard';
import { TaxDisclaimer } from '../components/TaxDisclaimer';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'freelance.btw_aangifte_title',
  subtitle: 'freelance.btw_aangifte_subtitle',
  viewTransactions: 'freelance.btw_transactions',
} as const;

/* ── Helpers ──────────────────────────────────────────── */

function mapToBizTxs(rawTransactions: readonly LocalTransaction[]): readonly BusinessTransaction[] {
  return rawTransactions
    .filter((tx) => tx.scope === 'business')
    .map((tx) => ({
      id: tx.id,
      amountCents: tx.amountCents,
      btwRate: tx.btwRate,
      btwAmountCents: tx.btwAmountCents,
      direction: tx.amountCents > 0 ? 'in' : 'out',
      bookedAt: nlDate(tx.date ?? '2026-09-05'),
      isTaxDeductible: tx.isTaxDeductible ?? true,
      description: tx.description,
      counterpartyName: tx.counterpartyName,
    }));
}

function ViewTransactionsButton({
  txCount,
  onPress,
}: {
  readonly txCount: number;
  readonly onPress: () => void;
}) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        padding: theme.spacing['16'],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.bgSurface,
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <View style={{ gap: theme.spacing['2'] }}>
        <Text variant="body" style={{ fontWeight: '600' }}>
          {t(TEXT.viewTransactions)} ({txCount})
        </Text>
        <Text variant="label" color="secondary">
          {t(TEXT.viewTransactions)}
        </Text>
      </View>
      <Text variant="body" color="accent">→</Text>
    </Pressable>
  );
}

/* ── Implementation ───────────────────────────────────── */

export function BtwAangifteScreen() {
  const t = useT();
  const router = useRouter();
  const { theme } = useTheme();

  const [selectedQ, setSelectedQ] = useState<QuarterNumber>(3);
  const filedQuarters = useBudgetStore((s) => s.filedBtwQuarters ?? []);
  const toggleQuarterFiled = useBudgetStore((s) => s.toggleQuarterFiled);

  const rawTransactions = useBudgetStore((s) => s.transactions);
  const businessTxs = mapToBizTxs(rawTransactions);

  const year = 2026;
  const quarters = allQuartersForYear(year);
  const currentQuarter = quarterByNumber(year, selectedQ);
  const isFiled = filedQuarters.includes(selectedQ);
  const aangifte = computeBtwAangifte(businessTxs, currentQuarter, isFiled ? 'filed' : 'draft');

  const handleViewTxs = () => {
    router.push({
      pathname: '/zakelijk/btw-kwartaal/[quarter]',
      params: { quarter: String(selectedQ) },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }}>
      <ScrollView testID="btw-aangifte-screen" contentContainerStyle={{ padding: theme.spacing['20'], gap: theme.spacing['16'], paddingBottom: 80 }}>
        <View style={{ gap: theme.spacing['4'] }}>
          <Text variant="title-lg">{t(TEXT.title)}</Text>
          <Text variant="body" color="secondary">{t(TEXT.subtitle)} · {year}</Text>
        </View>

        <QuarterSelector
          quarters={quarters}
          selectedQuarter={selectedQ}
          filedQuarters={filedQuarters}
          onSelectQuarter={setSelectedQ}
        />

        <FadeInView key={`quarter-${selectedQ}`} index={0} style={{ gap: theme.spacing['16'] }}>
          <RubriekenBreakdownCard
            quarter={currentQuarter}
            aangifte={aangifte}
            onToggleFiled={() => toggleQuarterFiled(selectedQ)}
          />
          <ViewTransactionsButton txCount={aangifte.transactionCount} onPress={handleViewTxs} />
          <TaxDisclaimer />
        </FadeInView>
      </ScrollView>
      <BottomBackButton />
    </View>
  );
}
