import { View } from 'react-native';
import { cents, type Cents } from '@shared';
import { BarChart, Card, Money, Text, useTheme, type BarChartSeries } from '@/ui';
import { useT } from '@/i18n';
import type { LocalTransaction } from '@/features/budget';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'overzicht.income_vs_expenses',
  incomeLabel: 'buckets.inkomen',
  expensesLabel: 'overzicht.expenses',
  savedAmount: 'overzicht.saved_amount',
  shortfallAmount: 'overzicht.shortfall_amount',
  netSurplus: 'overzicht.net_surplus',
  netShortfall: 'overzicht.net_shortfall',
  savingsRate: 'overzicht.savings_rate',
  thisMonth: 'overzicht.this_month',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface IncomeVsExpenseCardProps {
  readonly transactions: readonly LocalTransaction[];
}

function calculateTotals(transactions: readonly LocalTransaction[]) {
  let income = 0;
  let expenses = 0;
  for (const tx of transactions) {
    if (tx.amountCents > 0) income += tx.amountCents;
    else expenses += Math.abs(tx.amountCents);
  }
  const net = income - expenses;
  const rate = income > 0 ? Math.max(0, Math.round((net / income) * 100)) : 0;
  return { income, expenses, net, isSurplus: net >= 0, savingsRate: rate };
}

interface BannerProps {
  readonly isSurplus: boolean;
  readonly netCents: Cents;
  readonly savingsRate: number;
}

function NetResultBanner({ isSurplus, netCents, savingsRate }: BannerProps) {
  const t = useT();
  const { theme } = useTheme();
  const formatted = `€ ${Math.round(netCents / 100)}`;

  return (
    <View
      style={{
        padding: theme.spacing['12'],
        borderRadius: theme.radius.md,
        backgroundColor: isSurplus ? theme.colors.accentSoft : theme.colors.bgSubtle,
        borderWidth: 1,
        borderColor: isSurplus ? theme.colors.accentBg : theme.colors.statusWarn,
        gap: theme.spacing['4'],
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="label" color={isSurplus ? 'accent' : 'danger'} style={{ fontWeight: '600' }}>
          {isSurplus ? t(TEXT.netSurplus) : t(TEXT.netShortfall)}
        </Text>
        {isSurplus && savingsRate > 0 ? (
          <View
            style={{
              backgroundColor: theme.colors.bgSurface,
              paddingHorizontal: theme.spacing['8'],
              paddingVertical: 2,
              borderRadius: theme.radius.sm,
            }}
          >
            <Text variant="label" color="accent" style={{ fontWeight: '700' }}>
              {t(TEXT.savingsRate, { rate: savingsRate })}
            </Text>
          </View>
        ) : null}
      </View>
      <Text variant="body" color={isSurplus ? 'primary' : 'danger'}>
        {isSurplus
          ? t(TEXT.savedAmount, { amount: formatted })
          : t(TEXT.shortfallAmount, { amount: formatted })}
      </Text>
    </View>
  );
}

/* ── Component ────────────────────────────────────────── */

export function IncomeVsExpenseCard({ transactions }: IncomeVsExpenseCardProps) {
  const t = useT();
  const { theme } = useTheme();
  const { income, expenses, net, isSurplus, savingsRate } = calculateTotals(transactions);

  const series: readonly BarChartSeries[] = [
    { label: t(TEXT.incomeLabel), color: theme.colors.accentBg, values: [income / 100] },
    { label: t(TEXT.expensesLabel), color: theme.colors.statusDanger, values: [expenses / 100] },
  ];

  return (
    <Card padded style={{ gap: theme.spacing['16'], borderRadius: theme.radius.xl }}>
      <Text variant="title">{t(TEXT.title)}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ gap: theme.spacing['4'] }}>
          <Text variant="label" color="secondary">
            {t(TEXT.incomeLabel)}
          </Text>
          <Money cents={cents(income)} variant="title" />
        </View>
        <View style={{ gap: theme.spacing['4'], alignItems: 'flex-end' }}>
          <Text variant="label" color="secondary">
            {t(TEXT.expensesLabel)}
          </Text>
          <Money cents={cents(-expenses)} variant="title" />
        </View>
      </View>

      <BarChart
        categories={[t(TEXT.thisMonth)]}
        series={series}
        height={150}
        accessibilityLabel={t(TEXT.title)}
      />

      <NetResultBanner isSurplus={isSurplus} netCents={cents(Math.abs(net))} savingsRate={savingsRate} />
    </Card>
  );
}
