import { View } from 'react-native';
import { cents } from '@shared';
import { Card, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { LocalTransaction } from '@/features/budget';
import { CategoryBadge } from '@/features/transactions';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  topCategories: 'overzicht.top_categories',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface TopCategoriesCardProps {
  readonly transactions: readonly LocalTransaction[];
}

interface CategoryRankItemProps {
  readonly categoryKey: string;
  readonly amountRaw: number;
  readonly maxAmount: number;
  readonly rank: number;
}

function CategoryRankItem({ categoryKey, amountRaw, maxAmount, rank }: CategoryRankItemProps) {
  const { theme } = useTheme();
  const ratio = Math.min(1, Math.max(0.05, amountRaw / (maxAmount || 1)));

  return (
    <View style={{ gap: theme.spacing['4'], paddingVertical: theme.spacing['4'] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing['8'] }}>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.bgSubtle,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="label" color="secondary" style={{ fontSize: 11, fontWeight: '700' }}>
              {rank}
            </Text>
          </View>
          <CategoryBadge categoryKey={categoryKey} />
        </View>
        <Money cents={cents(-amountRaw)} variant="body" />
      </View>
      <View
        style={{
          height: 5,
          backgroundColor: theme.colors.bgSubtle,
          borderRadius: theme.radius.full,
          overflow: 'hidden',
          marginLeft: 30,
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${Math.round(ratio * 100)}%`,
            backgroundColor: theme.colors.accentBg,
            borderRadius: theme.radius.full,
          }}
        />
      </View>
    </View>
  );
}

/* ── Component ────────────────────────────────────────── */

export function TopCategoriesCard({ transactions }: TopCategoriesCardProps) {
  const t = useT();
  const { theme } = useTheme();

  const expenseTxs = transactions.filter((tx) => tx.amountCents < 0);
  const byCategory = new Map<string, number>();

  for (const tx of expenseTxs) {
    const current = byCategory.get(tx.categoryKey) ?? 0;
    byCategory.set(tx.categoryKey, current + Math.abs(tx.amountCents));
  }

  const sorted = Array.from(byCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxAmount = sorted[0]?.[1] ?? 1;

  return (
    <Card padded style={{ gap: theme.spacing['16'], borderRadius: theme.radius.xl }}>
      <Text variant="title">{t(TEXT.topCategories)}</Text>
      <View style={{ gap: theme.spacing['8'] }}>
        {sorted.map(([categoryKey, amountRaw], idx) => (
          <CategoryRankItem
            key={categoryKey}
            categoryKey={categoryKey}
            amountRaw={amountRaw}
            maxAmount={maxAmount}
            rank={idx + 1}
          />
        ))}
      </View>
    </Card>
  );
}
