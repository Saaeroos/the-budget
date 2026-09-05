import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatWithWeekday, nlDate } from '@shared';
import { EmptyTransactionsSvg, FadeInView, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { useBudgetStore, type LocalTransaction } from '@/features/budget';
import { TransactionFilters, type FilterBucket } from '../components/TransactionFilters';
import { TransactionItemCard } from '../components/TransactionItemCard';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'transactions.title',
  noResults: 'transactions.no_results',
  emptySubtitle: 'transactions.empty_subtitle',
  emptyBody: 'transactions.empty_body',
} as const;

const TEST_ID = {
  screen: 'transacties-screen',
} as const;

/* ── Helpers ──────────────────────────────────────────── */

function matchesFilter(tx: LocalTransaction, bucket: FilterBucket): boolean {
  if (bucket === 'all') return true;
  if (bucket === 'business') return tx.scope === 'business';
  if (bucket === 'personal') return tx.scope !== 'business';
  return tx.bucket === bucket;
}

function filterTransactions(
  transactions: readonly LocalTransaction[],
  query: string,
  bucket: FilterBucket,
): readonly LocalTransaction[] {
  const q = query.trim().toLowerCase();
  return transactions.filter((tx) => {
    if (!matchesFilter(tx, bucket)) return false;
    if (!q) return true;
    return (
      tx.counterpartyName.toLowerCase().includes(q) ||
      tx.description.toLowerCase().includes(q) ||
      tx.categoryKey.toLowerCase().includes(q)
    );
  });
}

interface DateGroup {
  readonly date: string;
  readonly transactions: readonly LocalTransaction[];
}

function groupTransactionsByDate(transactions: readonly LocalTransaction[]): readonly DateGroup[] {
  const map = new Map<string, LocalTransaction[]>();
  for (const tx of transactions) {
    const existing = map.get(tx.date) ?? [];
    existing.push(tx);
    map.set(tx.date, existing);
  }
  return Array.from(map.entries()).map(([date, items]) => ({
    date,
    transactions: items,
  }));
}

function formatDateHeader(dateStr: string): string {
  try {
    return formatWithWeekday(nlDate(dateStr));
  } catch {
    return dateStr;
  }
}

function TransactionsEmptyView({ hasQuery }: { readonly hasQuery: boolean }) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <FadeInView
      delay={100}
      style={{ alignItems: 'center', paddingVertical: theme.spacing['40'], gap: theme.spacing['16'] }}
    >
      <EmptyTransactionsSvg size={120} />
      <Text variant="title" style={{ textAlign: 'center' }}>
        {t(TEXT.noResults)}
      </Text>
      <Text variant="body" color="secondary" style={{ textAlign: 'center', maxWidth: 280 }}>
        {hasQuery ? t(TEXT.emptySubtitle) : t(TEXT.emptyBody)}
      </Text>
    </FadeInView>
  );
}

/* ── Screen Component ─────────────────────────────────── */

export function TransactionsScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const transactions = useBudgetStore((s) => s.transactions);
  const [query, setQuery] = useState('');
  const [bucket, setBucket] = useState<FilterBucket>('all');

  const filtered = filterTransactions(transactions, query, bucket);
  const groups = groupTransactionsByDate(filtered);

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
        <Text variant="title-lg">{t(TEXT.title)}</Text>
        <TransactionFilters
          query={query}
          onQueryChange={setQuery}
          selectedBucket={bucket}
          onSelectBucket={setBucket}
        />
        {filtered.length === 0 ? (
          <TransactionsEmptyView hasQuery={Boolean(query)} />
        ) : (
          <FadeInView index={1}>
            <View style={{ gap: theme.spacing['16'] }}>
              {groups.map((group) => (
                <View key={group.date} style={{ gap: theme.spacing['8'] }}>
                  <Text
                    variant="label"
                    color="secondary"
                    style={{ paddingHorizontal: theme.spacing['4'], fontWeight: '600' }}
                  >
                    {formatDateHeader(group.date)}
                  </Text>
                  <View
                    style={{
                      borderRadius: theme.radius.xl,
                      backgroundColor: theme.colors.bgSurface,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: theme.colors.borderSubtle,
                      overflow: 'hidden',
                    }}
                  >
                    {group.transactions.map((tx, idx) => (
                      <TransactionItemCard
                        key={tx.id}
                        transaction={tx}
                        grouped
                        isFirst={idx === 0}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>
        )}
      </ScrollView>
    </View>
  );
}
