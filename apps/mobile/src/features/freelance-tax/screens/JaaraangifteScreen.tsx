import { ScrollView, View } from 'react-native';
import { cents, computeAnnualTaxReturn, getTaxParams, nlDate, type AnnualTaxReturn, type BusinessTransaction, type TaxParams } from '@shared';
import { BottomBackButton, Card, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { useBudgetStore } from '@/features/budget';
import { FilingStatusBadge } from '../components/FilingStatusBadge';
import { ProfitWaterfallChart } from '../components/ProfitWaterfallChart';
import { TaxDisclaimer } from '../components/TaxDisclaimer';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'freelance.jaaraangifte_title',
  subtitle: 'freelance.jaaraangifte_subtitle',
  box1Title: 'freelance.box1_title',
  box3Title: 'freelance.box3_title',
  box3Assets: 'freelance.box3_assets',
  box3Vrijstelling: 'freelance.box3_vrijstelling',
  box3Tax: 'freelance.box3_tax',
} as const;

/* ── Sub-components ───────────────────────────────────── */

function Box1Card({ annualReturn }: { readonly annualReturn: AnnualTaxReturn }) {
  const t = useT();
  const { theme } = useTheme();
  return (
    <Card padded style={{ gap: theme.spacing['12'], borderRadius: theme.radius.xl }}>
      <Text variant="title">{t(TEXT.box1Title)}</Text>
      <View style={{ gap: theme.spacing['8'] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="body" color="secondary">Bruto Box 1 belasting</Text>
          <Money cents={annualReturn.box1TaxCents} variant="body" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="body" color="secondary">Heffingskortingen (aftrek)</Text>
          <Money cents={cents(-Math.abs(annualReturn.heffingskortingenCents))} variant="body" color="positive" />
        </View>
        <View style={{ height: 1, backgroundColor: theme.colors.borderSubtle }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="body" style={{ fontWeight: '700' }}>Te betalen Box 1</Text>
          <Money cents={annualReturn.estimatedIncomeTaxCents} variant="body-lg" color="primary" />
        </View>
      </View>
    </Card>
  );
}

function Box3Card({ annualReturn, params }: { readonly annualReturn: AnnualTaxReturn; readonly params: TaxParams }) {
  const t = useT();
  const { theme } = useTheme();
  return (
    <Card padded style={{ gap: theme.spacing['12'], borderRadius: theme.radius.xl }}>
      <Text variant="title">{t(TEXT.box3Title)}</Text>
      <View style={{ gap: theme.spacing['8'] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="body" color="secondary">{t(TEXT.box3Assets)}</Text>
          <Money cents={cents(4500000)} variant="body" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="body" color="secondary">{t(TEXT.box3Vrijstelling)}</Text>
          <Money cents={params.box3VrijstellingCents} variant="body" color="secondary" />
        </View>
        <View style={{ height: 1, backgroundColor: theme.colors.borderSubtle }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="body" style={{ fontWeight: '700' }}>{t(TEXT.box3Tax)}</Text>
          <Money cents={annualReturn.box3?.estimatedTaxCents ?? cents(0)} variant="body-lg" color="primary" />
        </View>
      </View>
    </Card>
  );
}

/* ── Implementation ───────────────────────────────────── */

export function JaaraangifteScreen() {
  const t = useT();
  const { theme } = useTheme();

  const rawTransactions = useBudgetStore((s) => s.transactions);
  const businessTxs: readonly BusinessTransaction[] = rawTransactions
    .filter((tx) => tx.scope === 'business')
    .map((tx) => ({
      id: tx.id,
      amountCents: tx.amountCents,
      btwRate: tx.btwRate,
      btwAmountCents: tx.btwAmountCents,
      direction: tx.amountCents > 0 ? 'in' : 'out',
      bookedAt: nlDate(tx.date ?? '2026-09-05'),
      isTaxDeductible: tx.isTaxDeductible ?? true,
      description: tx.description,
      counterpartyName: tx.counterpartyName,
    }));

  const year = 2026;
  const params = getTaxParams(year);
  const annualReturn = computeAnnualTaxReturn(businessTxs, {
    year,
    config: { isStarter: true, meetsHourCriterion: true, box3AssetsCents: cents(4500000) },
    status: 'in_progress',
    params,
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }}>
      <ScrollView testID="jaaraangifte-screen" contentContainerStyle={{ padding: theme.spacing['20'], gap: theme.spacing['16'], paddingBottom: 80 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ gap: theme.spacing['2'] }}>
            <Text variant="title-lg">{t(TEXT.title)}</Text>
            <Text variant="body" color="secondary">{t(TEXT.subtitle, { year })}</Text>
          </View>
          <FilingStatusBadge status={annualReturn.status} />
        </View>

        <ProfitWaterfallChart annualReturn={annualReturn} />
        <Box1Card annualReturn={annualReturn} />
        <Box3Card annualReturn={annualReturn} params={params} />
        <TaxDisclaimer />
      </ScrollView>
      <BottomBackButton />
    </View>
  );
}
