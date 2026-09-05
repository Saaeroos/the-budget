import { useCallback, useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { cents, type Cents } from '@shared';
import { FadeInView, useTheme } from '@/ui';
import { useBudgetStore, useSafeToSpend } from '@/features/budget';
import { useFirstEnvelope } from '@/features/onboarding';
import { TodayHeader } from '../components/TodayHeader';
import { TodayHeroCard } from '../components/TodayHeroCard';
import { TodayReviewCard } from '../components/TodayReviewCard';
import { TodayUpcomingList } from '../components/TodayUpcomingList';
import { TodayPotjesPreview } from '../components/TodayPotjesPreview';
import { TodayRecentTransactions } from '../components/TodayRecentTransactions';

/* ── Constants ────────────────────────────────────────── */

const TEST_ID = {
  screen: 'vandaag-screen',
} as const;

/* ── Helpers ──────────────────────────────────────────── */

function useTodayAccounts() {
  const accounts = useBudgetStore((s) => s.accounts);
  const setAccountBalance = useBudgetStore((s) => s.setAccountBalance);

  const checkingAccount = accounts.find((a) => a.id === 'acc-main');
  const cardAccount = accounts.find((a) => a.type === 'card');

  const totalBalanceRaw = accounts
    .filter((a) => a.type === 'payment')
    .reduce((sum, a) => sum + a.balanceCents, 0);
  const totalBalanceCents: Cents = cents(totalBalanceRaw);

  const toggleOverdraft = useCallback(() => {
    if (!checkingAccount) return;
    const isCurrentlyNegative = checkingAccount.balanceCents < 0;
    const nextBalance = isCurrentlyNegative ? cents(245000) : cents(-15000);
    setAccountBalance(checkingAccount.id, nextBalance);
  }, [checkingAccount, setAccountBalance]);

  return { checkingAccount, cardAccount, totalBalanceCents, toggleOverdraft };
}

function useTodayBudget() {
  const transactions = useBudgetStore((s) => s.transactions);
  const upcomingBills = useBudgetStore((s) => s.upcomingBills);
  const envelopes = useBudgetStore((s) => s.envelopes);
  const periodLabel = useBudgetStore((s) => s.periodLabel);
  const initFromOnboardingEnvelope = useBudgetStore((s) => s.initFromOnboardingEnvelope);
  const firstEnvelope = useFirstEnvelope();

  useEffect(() => {
    if (firstEnvelope) initFromOnboardingEnvelope(firstEnvelope);
  }, [firstEnvelope, initFromOnboardingEnvelope]);

  const unreviewedCount = transactions.filter((t) => !t.isReviewed).length;

  return { transactions, upcomingBills, envelopes, periodLabel, unreviewedCount };
}

/* ── Screen Component ─────────────────────────────────── */

export function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const sts = useSafeToSpend();
  const { checkingAccount, cardAccount, totalBalanceCents, toggleOverdraft } = useTodayAccounts();
  const { transactions, upcomingBills, envelopes, periodLabel, unreviewedCount } = useTodayBudget();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas, paddingTop: insets.top }}>
      <ScrollView
        testID={TEST_ID.screen}
        contentContainerStyle={{
          padding: theme.spacing['20'],
          gap: theme.spacing['24'],
          paddingBottom: insets.bottom + 96,
        }}
      >
        <TodayHeader periodLabel={periodLabel} />
        <FadeInView index={0}>
          <TodayHeroCard
            sts={sts}
            totalBalanceCents={totalBalanceCents}
            checkingAccount={checkingAccount}
            cardAccount={cardAccount}
            onToggleSimulateOverdraft={toggleOverdraft}
          />
        </FadeInView>
        <FadeInView index={1}>
          <TodayReviewCard unreviewedCount={unreviewedCount} onPress={() => router.push('/(tabs)/transacties')} />
        </FadeInView>
        <FadeInView index={2}>
          <TodayUpcomingList bills={upcomingBills} />
        </FadeInView>
        <FadeInView index={3}>
          <TodayPotjesPreview envelopes={envelopes} />
        </FadeInView>
        <FadeInView index={4}>
          <TodayRecentTransactions transactions={transactions} />
        </FadeInView>
      </ScrollView>
    </View>
  );
}
