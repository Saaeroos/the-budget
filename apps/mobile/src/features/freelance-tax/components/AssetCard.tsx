import { View } from 'react-native';
import { Card, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { cents, computeAnnualDepreciation, type Cents } from '@shared';
import type { BusinessAsset } from '../types';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  purchaseCost: 'freelance.asset_purchase_cost',
  depreciationThisYear: 'freelance.asset_depreciation_this_year',
  remainingBookValue: 'freelance.asset_book_value',
  exclBtw: 'freelance.excl_btw',
} as const;

/* ── Types ────────────────────────────────────────────── */
export interface AssetCardProps {
  readonly asset: BusinessAsset;
  readonly referenceYear?: number;
}

interface FooterProps {
  readonly annualDepreciation: Cents;
  readonly remainingBookValue: Cents;
}

/* ── Sub-component ────────────────────────────────────── */
function AssetDepreciationFooter({ annualDepreciation, remainingBookValue }: FooterProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: theme.spacing['8'],
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderSubtle,
      }}
    >
      <View style={{ gap: theme.spacing['2'] }}>
        <Text variant="label" color="secondary">{t(TEXT.depreciationThisYear)}</Text>
        <Money cents={annualDepreciation} variant="label" color="accent" />
      </View>

      <View style={{ alignItems: 'flex-end', gap: theme.spacing['2'] }}>
        <Text variant="label" color="secondary">{t(TEXT.remainingBookValue)}</Text>
        <Money cents={remainingBookValue} variant="label" color="primary" />
      </View>
    </View>
  );
}

/* ── Implementation ───────────────────────────────────── */
export function AssetCard({ asset, referenceYear = 2026 }: AssetCardProps) {
  const t = useT();
  const { theme } = useTheme();

  const annualDepreciation = computeAnnualDepreciation(asset, referenceYear);
  const remainingValue = cents(Math.max(0, asset.purchaseCostCents - annualDepreciation));

  return (
    <Card style={{ padding: theme.spacing['16'], gap: theme.spacing['12'], backgroundColor: theme.colors.bgSurface }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ gap: theme.spacing['2'] }}>
          <Text variant="title" color="primary">{asset.name}</Text>
          <Text variant="label" color="secondary">
            {asset.purchaseDate} · {asset.category} · {Math.round(asset.lifespanMonths / 12)} jr
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end', gap: theme.spacing['2'] }}>
          <Money cents={asset.purchaseCostCents} variant="title" color="primary" />
          <Text variant="label" color="secondary">{t(TEXT.exclBtw)}</Text>
        </View>
      </View>

      <AssetDepreciationFooter annualDepreciation={annualDepreciation} remainingBookValue={remainingValue} />
    </Card>
  );
}
