import { View } from 'react-native';
import { cents, formatEUR, type Cents } from '@shared';
import { Card, JaarafrekeningSvg, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { LocalYearlyExpense } from '@/features/budget';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'potjes.yearly_title',
  subtitle: 'potjes.yearly_subtitle',
  totalYear: 'potjes.yearly_total',
  monthlyReserve: 'potjes.yearly_monthly_reserve',
  monthlyDesc: 'potjes.yearly_monthly_desc',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface YearlyExpensesHeroProps {
  readonly expenses: readonly LocalYearlyExpense[];
}

function YearlyTotalsRow({
  totalCents,
  monthlyCents,
}: {
  readonly totalCents: Cents;
  readonly monthlyCents: Cents;
}) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: theme.spacing['12'],
        borderTopWidth: 1,
        borderColor: theme.colors.borderSubtle,
      }}
    >
      <View style={{ gap: theme.spacing['2'] }}>
        <Text variant="label" color="secondary">
          {t(TEXT.totalYear)}
        </Text>
        <Money cents={totalCents} variant="title" />
      </View>
      <View style={{ gap: theme.spacing['2'], alignItems: 'flex-end' }}>
        <Text variant="label" color="secondary">
          {t(TEXT.monthlyReserve)}
        </Text>
        <Money cents={monthlyCents} variant="title" />
      </View>
    </View>
  );
}

/* ── Component ────────────────────────────────────────── */

export function YearlyExpensesHero({ expenses }: YearlyExpensesHeroProps) {
  const t = useT();
  const { theme } = useTheme();

  const totalCentsRaw = expenses.reduce((sum, e) => sum + e.amountCents, 0);
  const totalCents: Cents = cents(totalCentsRaw);
  const monthlyCents: Cents = cents(Math.ceil(totalCentsRaw / 12));
  const formattedMonthly = formatEUR(monthlyCents);

  return (
    <Card padded style={{ gap: theme.spacing['16'] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ gap: theme.spacing['4'], flex: 1, paddingRight: theme.spacing['12'] }}>
          <Text variant="title">{t(TEXT.title)}</Text>
          <Text variant="body" color="secondary">
            {t(TEXT.subtitle)}
          </Text>
        </View>
        <JaarafrekeningSvg size={72} />
      </View>

      <YearlyTotalsRow totalCents={totalCents} monthlyCents={monthlyCents} />

      <View
        style={{
          padding: theme.spacing['12'],
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.bgSubtle,
        }}
      >
        <Text variant="label" color="secondary">
          {t(TEXT.monthlyDesc, { amount: formattedMonthly })}
        </Text>
      </View>
    </Card>
  );
}
