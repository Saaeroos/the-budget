import { View } from 'react-native';
import { cents, type Cents } from '@shared';
import { Card, DonutChart, Money, Text, useTheme, type CategoryGroup, type DonutSegment } from '@/ui';
import { useT } from '@/i18n';
import type { LocalTransaction } from '@/features/budget';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  distribution: 'overzicht.distribution',
  vasteLasten: 'buckets.vaste_lasten',
  reserveringen: 'buckets.reserveringen',
  huishoudelijk: 'buckets.huishoudelijk',
  vrijBesteedbaar: 'buckets.vrij_besteedbaar',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface BucketBreakdownCardProps {
  readonly transactions: readonly LocalTransaction[];
}

interface LegendItem {
  readonly label: string;
  readonly amount: Cents;
  readonly bucket: CategoryGroup;
  readonly percentage: number;
}

function calcBucketTotal(transactions: readonly LocalTransaction[], bucket: string): number {
  return Math.abs(
    transactions
      .filter((tx) => tx.bucket === bucket && tx.amountCents < 0)
      .reduce((sum, tx) => sum + tx.amountCents, 0),
  );
}

function LegendRow({ item }: { readonly item: LegendItem }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing['8'] }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: theme.radius.full,
            backgroundColor: theme.bucketColor[item.bucket],
          }}
        />
        <Text variant="body" color="secondary">
          {item.label}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing['8'] }}>
        <View
          style={{
            backgroundColor: theme.colors.bgSubtle,
            paddingHorizontal: theme.spacing['8'],
            paddingVertical: 2,
            borderRadius: theme.radius.sm,
          }}
        >
          <Text variant="label" color="secondary">
            {`${item.percentage}%`}
          </Text>
        </View>
        <Money cents={item.amount} variant="body" />
      </View>
    </View>
  );
}

/* ── Component ────────────────────────────────────────── */

export function BucketBreakdownCard({ transactions }: BucketBreakdownCardProps) {
  const t = useT();
  const { theme } = useTheme();

  const vl = calcBucketTotal(transactions, 'vaste_lasten');
  const res = calcBucketTotal(transactions, 'reserveringen');
  const hh = calcBucketTotal(transactions, 'huishoudelijk');
  const vrij = calcBucketTotal(transactions, 'vrij_besteedbaar');
  const total = vl + res + hh + vrij;

  const pct = (val: number) => (total > 0 ? Math.round((val / total) * 100) : 0);
  const segments: readonly DonutSegment[] = [
    { bucket: 'vaste_lasten', value: vl || 1 },
    { bucket: 'reserveringen', value: res || 1 },
    { bucket: 'huishoudelijk', value: hh || 1 },
    { bucket: 'vrij_besteedbaar', value: vrij || 1 },
  ];

  const items: readonly LegendItem[] = [
    { label: t(TEXT.vasteLasten), amount: cents(vl), bucket: 'vaste_lasten', percentage: pct(vl) },
    { label: t(TEXT.reserveringen), amount: cents(res), bucket: 'reserveringen', percentage: pct(res) },
    { label: t(TEXT.huishoudelijk), amount: cents(hh), bucket: 'huishoudelijk', percentage: pct(hh) },
    { label: t(TEXT.vrijBesteedbaar), amount: cents(vrij), bucket: 'vrij_besteedbaar', percentage: pct(vrij) },
  ];

  return (
    <Card padded style={{ gap: theme.spacing['16'], borderRadius: theme.radius.xl }}>
      <Text variant="title">{t(TEXT.distribution)}</Text>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <DonutChart segments={segments} size={170} strokeWidth={18} accessibilityLabel={t(TEXT.distribution)}>
          <Money cents={cents(total)} variant="title" />
        </DonutChart>
      </View>
      <View style={{ gap: theme.spacing['8'] }}>
        {items.map((item) => (
          <LegendRow key={item.label} item={item} />
        ))}
      </View>
    </Card>
  );
}
