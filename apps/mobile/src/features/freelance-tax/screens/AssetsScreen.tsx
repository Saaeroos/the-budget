import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { BottomBackButton, Button, Card, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { cents, computeTotalDepreciationForYear, nlDate, type Cents } from '@shared';
import type { BusinessAsset } from '../types';
import { KiaProgressBar } from '../components/KiaProgressBar';
import { AssetCard } from '../components/AssetCard';
import { AddAssetModal } from '../components/AddAssetModal';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'freelance.assets_screen_title',
  subtitle: 'freelance.assets_screen_subtitle',
  totalDepreciationCardTitle: 'freelance.total_depreciation_title',
  totalDepreciationDesc: 'freelance.total_depreciation_desc',
  addAssetButton: 'freelance.add_asset_button',
  emptyAssets: 'freelance.no_assets_yet',
} as const;

/* ── Fixtures ─────────────────────────────────────────── */
const INITIAL_ASSETS: readonly BusinessAsset[] = [
  {
    id: 'asset-1',
    name: 'MacBook Pro 16" M3 Max',
    category: 'hardware',
    purchaseDate: nlDate('2026-01-15'),
    purchaseCostCents: cents(249900),
    residualValueCents: cents(25000),
    lifespanMonths: 60,
    btwRate: 21,
    btwAmountCents: cents(52479),
    isKiaEligible: true,
  },
  {
    id: 'asset-2',
    name: 'Studio Display 27"',
    category: 'hardware',
    purchaseDate: nlDate('2026-03-01'),
    purchaseCostCents: cents(149900),
    residualValueCents: cents(15000),
    lifespanMonths: 60,
    btwRate: 21,
    btwAmountCents: cents(31479),
    isKiaEligible: true,
  },
];

function sumKiaInvestments(assets: readonly BusinessAsset[]): Cents {
  let sum = 0;
  for (const a of assets) {
    if (a.isKiaEligible) sum += a.purchaseCostCents;
  }
  return cents(sum);
}

interface HeaderProps {
  readonly totalInvestmentsCents: Cents;
  readonly totalDepreciation2026: Cents;
  readonly onAddPress: () => void;
}

function AssetsHeader({ totalInvestmentsCents, totalDepreciation2026, onAddPress }: HeaderProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View style={{ gap: theme.spacing['16'], marginBottom: theme.spacing['8'] }}>
      <View style={{ gap: theme.spacing['4'] }}>
        <Text variant="display" color="primary">{t(TEXT.title)}</Text>
        <Text variant="body" color="secondary">{t(TEXT.subtitle)}</Text>
      </View>

      <KiaProgressBar totalInvestmentsCents={totalInvestmentsCents} />

      <Card style={{ padding: theme.spacing['16'], gap: theme.spacing['4'], backgroundColor: theme.colors.bgSurface }}>
        <Text variant="label" color="secondary">{t(TEXT.totalDepreciationCardTitle)} (2026)</Text>
        <Money cents={totalDepreciation2026} variant="title" color="accent" />
        <Text variant="label" color="secondary">{t(TEXT.totalDepreciationDesc)}</Text>
      </Card>

      <Button label={t(TEXT.addAssetButton)} variant="secondary" size="md" onPress={onAddPress} />
    </View>
  );
}

/* ── Implementation ───────────────────────────────────── */
export function AssetsScreen() {
  const t = useT();
  const { theme } = useTheme();

  const [assets, setAssets] = useState<readonly BusinessAsset[]>(INITIAL_ASSETS);
  const [modalVisible, setModalVisible] = useState(false);

  const totalInvestments = useMemo(() => sumKiaInvestments(assets), [assets]);
  const totalDepr2026 = useMemo(() => computeTotalDepreciationForYear(assets, 2026), [assets]);

  const handleAddAsset = (data: Omit<BusinessAsset, 'id'>) => {
    setAssets([{ ...data, id: `asset-${Date.now()}` }, ...assets]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }}>
      <FlatList
        data={assets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing['16'], gap: theme.spacing['12'], paddingBottom: theme.spacing['40'] }}
        ListHeaderComponent={<AssetsHeader totalInvestmentsCents={totalInvestments} totalDepreciation2026={totalDepr2026} onAddPress={() => setModalVisible(true)} />}
        renderItem={({ item }) => <AssetCard asset={item} referenceYear={2026} />}
        ListEmptyComponent={<Text variant="body" color="secondary" style={{ textAlign: 'center', marginTop: 24 }}>{t(TEXT.emptyAssets)}</Text>}
        ListFooterComponent={<BottomBackButton style={{ marginTop: theme.spacing['16'] }} />}
      />

      <AddAssetModal visible={modalVisible} onClose={() => setModalVisible(false)} onSave={handleAddAsset} />
    </View>
  );
}
