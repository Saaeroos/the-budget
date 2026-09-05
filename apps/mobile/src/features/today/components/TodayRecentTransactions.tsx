import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { LocalTransaction } from '@/features/budget';
import { CategoryBadge } from '@/features/transactions';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  recent: 'today.recent',
  viewAll: 'today.view_all_transactions',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface TodayRecentTransactionsProps {
  readonly transactions: readonly LocalTransaction[];
}

/* ── Sub-components ───────────────────────────────────── */

function RecentTxRow({ tx, isFirst }: { readonly tx: LocalTransaction; readonly isFirst: boolean }) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing['12'],
        borderTopWidth: isFirst ? 0 : 1,
        borderTopColor: theme.colors.borderSubtle,
      }}
    >
      <View style={{ gap: theme.spacing['4'], flex: 1, paddingRight: theme.spacing['8'] }}>
        <Text variant="body" numberOfLines={1} style={{ fontWeight: '500' }}>
          {tx.counterpartyName}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <CategoryBadge categoryKey={tx.categoryKey} />
        </View>
      </View>
      <Money
        cents={tx.amountCents}
        variant="body"
        color={tx.amountCents > 0 ? 'positive' : 'primary'}
      />
    </View>
  );
}

/* ── Component ────────────────────────────────────────── */

export function TodayRecentTransactions({ transactions }: TodayRecentTransactionsProps) {
  const t = useT();
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View style={{ gap: theme.spacing['12'] }}>
      <Text variant="title">{t(TEXT.recent)}</Text>
      <View
        style={{
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.bgSurface,
          paddingHorizontal: theme.spacing['16'],
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
        }}
      >
        {transactions.slice(0, 4).map((tx, i) => (
          <RecentTxRow key={tx.id} tx={tx} isFirst={i === 0} />
        ))}
      </View>
      <Button
        variant="secondary"
        size="md"
        fullWidth
        label={t(TEXT.viewAll)}
        testID="today-view-all-transactions-button"
        onPress={() => router.push('/(tabs)/transacties')}
      />
    </View>
  );
}
