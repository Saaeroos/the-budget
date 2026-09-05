import { View } from 'react-native';
import { Card, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { LocalYearlyExpense } from '@/features/budget';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  dueIn: 'potjes.due_in',
  covered: 'potjes.covered',
  notCovered: 'potjes.not_covered',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface YearlyExpenseCardProps {
  readonly expense: LocalYearlyExpense;
  readonly isCovered: boolean;
}

/* ── Sub-component ────────────────────────────────────── */

function StatusPill({ isCovered }: { readonly isCovered: boolean }) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing['8'],
        paddingVertical: theme.spacing['4'],
        borderRadius: theme.radius.sm,
        backgroundColor: isCovered ? theme.colors.accentBg : theme.colors.bgSubtle,
      }}
    >
      <Text variant="label" color={isCovered ? 'inverse' : 'secondary'}>
        {t(isCovered ? TEXT.covered : TEXT.notCovered)}
      </Text>
    </View>
  );
}

/* ── Component ────────────────────────────────────────── */

export function YearlyExpenseCard({ expense, isCovered }: YearlyExpenseCardProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <Card padded style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ gap: theme.spacing['4'], flex: 1, paddingRight: theme.spacing['12'] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing['8'] }}>
          <View
            style={{
              paddingHorizontal: theme.spacing['8'],
              paddingVertical: 2,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.bgSubtle,
            }}
          >
            <Text variant="label" color="accent">
              {expense.quarter}
            </Text>
          </View>
          <Text variant="label" color="secondary">
            {t(TEXT.dueIn, { month: expense.dueMonth })}
          </Text>
        </View>

        <Text variant="body" numberOfLines={1}>
          {expense.name}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end', gap: theme.spacing['4'] }}>
        <Money cents={expense.amountCents} variant="title" />
        <StatusPill isCovered={isCovered} />
      </View>
    </Card>
  );
}
