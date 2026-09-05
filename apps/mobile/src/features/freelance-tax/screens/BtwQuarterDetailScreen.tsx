import { useLocalSearchParams } from 'expo-router';
import { FlatList, View } from 'react-native';
import { cents, isInQuarter, nlDate, quarterByNumber, type BusinessTransaction, type QuarterNumber } from '@shared';
import { BottomBackButton, Card, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { useBudgetStore, type LocalTransaction } from '@/features/budget';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'freelance.btw_transactions',
  empty: 'freelance.no_business_transactions',
  rate21: 'freelance.btw_rate_21',
  rate9: 'freelance.btw_rate_9',
  rate0: 'freelance.btw_rate_0',
  rateMissing: 'freelance.btw_no_rate',
} as const;

/* ── Types ────────────────────────────────────────────── */

export interface BtwQuarterDetailScreenProps {
  readonly initialQuarter?: QuarterNumber | undefined;
}

/* ── Sub-components ───────────────────────────────────── */

function TxAmountColumn({ tx }: { readonly tx: BusinessTransaction }) {
  const isIncome = tx.direction === 'in';
  const amount = isIncome ? tx.amountCents : cents(-Math.abs(tx.amountCents));

  return (
    <View style={{ alignItems: 'flex-end', gap: 2 }}>
      <Money cents={amount} variant="body" color={isIncome ? 'positive' : 'primary'} />
      {tx.btwAmountCents ? (
        <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <Text variant="label" color="secondary" style={{ fontSize: 11 }}>BTW:</Text>
          <Money cents={tx.btwAmountCents} variant="label" color="secondary" />
        </View>
      ) : null}
    </View>
  );
}

function TxTaxRow({ tx }: { readonly tx: BusinessTransaction }) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing['12'],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderSubtle,
      }}
    >
      <View style={{ flex: 1, marginRight: theme.spacing['12'], gap: theme.spacing['2'] }}>
        <Text variant="body" numberOfLines={1} style={{ fontWeight: '600' }}>
          {tx.counterpartyName ?? tx.description ?? 'Zakelijke transactie'}
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing['8'], alignItems: 'center' }}>
          <Text variant="label" color="secondary" style={{ fontSize: 11 }}>{tx.bookedAt}</Text>
          <View style={{ paddingHorizontal: theme.spacing['4'], paddingVertical: 1, borderRadius: theme.radius.sm, backgroundColor: theme.colors.bgSubtle }}>
            <Text variant="label" color="accent" style={{ fontSize: 11, fontWeight: '600' }}>
              {tx.btwRate !== undefined ? `${tx.btwRate}% BTW` : 'Geen BTW'}
            </Text>
          </View>
        </View>
      </View>
      <TxAmountColumn tx={tx} />
    </View>
  );
}

function mapQuarterTxs(
  rawTransactions: readonly LocalTransaction[],
  quarter: ReturnType<typeof quarterByNumber>,
): readonly BusinessTransaction[] {
  return rawTransactions
    .filter((tx) => tx.scope === 'business')
    .map((tx) => ({
      id: tx.id,
      amountCents: tx.amountCents,
      btwRate: tx.btwRate,
      btwAmountCents: tx.btwAmountCents,
      direction: (tx.amountCents > 0 ? 'in' : 'out') as 'in' | 'out',
      bookedAt: nlDate(tx.date ?? '2026-09-05'),
      isTaxDeductible: tx.isTaxDeductible ?? true,
      description: tx.description,
      counterpartyName: tx.counterpartyName,
    }))
    .filter((tx) => isInQuarter(tx.bookedAt, quarter));
}

/* ── Component ────────────────────────────────────────── */

export function BtwQuarterDetailScreen({ initialQuarter }: BtwQuarterDetailScreenProps) {
  const t = useT();
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ quarter?: string }>();

  const qNum = (Number(params.quarter) || initialQuarter || 3) as QuarterNumber;
  const quarter = quarterByNumber(2026, qNum);

  const rawTransactions = useBudgetStore((s) => s.transactions);
  const quarterTxs = mapQuarterTxs(rawTransactions, quarter);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas, padding: theme.spacing['20'], gap: theme.spacing['16'] }}>
      <View style={{ gap: theme.spacing['2'] }}>
        <Text variant="title-lg">{quarter.label}</Text>
        <Text variant="label" color="secondary">{t(TEXT.title)}</Text>
      </View>

      <Card padded style={{ flex: 1, borderRadius: theme.radius.xl }}>
        {quarterTxs.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text variant="body" color="secondary">{t(TEXT.empty)}</Text>
          </View>
        ) : (
          <FlatList
            data={quarterTxs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TxTaxRow tx={item} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Card>
      <BottomBackButton />
    </View>
  );
}
