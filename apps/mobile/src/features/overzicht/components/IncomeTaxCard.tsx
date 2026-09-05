import { Pressable, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { cents } from '@shared';
import { Card, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { FreelanceTaxSummary } from '@/features/budget';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  ibTitle: 'freelance.ib_title',
  ibDesc: 'freelance.ib_desc',
  profitPeriod: 'freelance.profit_period',
  deductions: 'freelance.zelfstandigenaftrek',
  viewAnnual: 'freelance.view_jaaroverzicht',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface IncomeTaxCardProps {
  readonly summary: FreelanceTaxSummary;
  readonly onPress?: (() => void) | undefined;
}

function TaxSummaryLines({ summary }: { readonly summary: FreelanceTaxSummary }) {
  const { theme } = useTheme();
  const t = useT();
  const deductions = summary.annualReturn?.deductions;

  return (
    <View style={{ gap: theme.spacing['8'] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="body" color="secondary">
          {t(TEXT.profitPeriod)}
        </Text>
        <Money cents={summary.estimatedProfit} variant="body" />
      </View>

      {deductions && deductions.totalDeductionsCents > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="body" color="secondary">
            Aftrekposten (ZZP & MKB)
          </Text>
          <Money
            cents={cents(-Math.abs(deductions.totalDeductionsCents))}
            variant="body"
            color="positive"
          />
        </View>
      )}

      <View style={{ height: 1, backgroundColor: theme.colors.borderSubtle }} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="body" style={{ fontWeight: '600' }}>
          Aanbevolen reserve (30%)
        </Text>
        <Money cents={summary.incomeTaxReserve} variant="body-lg" color="accent" />
      </View>
    </View>
  );
}

/* ── Component ────────────────────────────────────────── */

export function IncomeTaxCard({ summary, onPress }: IncomeTaxCardProps) {
  const t = useT();
  const router = useRouter();
  const { theme } = useTheme();

  const handlePress = onPress ?? (() => router.push('/zakelijk/jaaraangifte' as Href<string>));

  return (
    <Card padded style={{ gap: theme.spacing['16'], borderRadius: theme.radius.xl }}>
      <View style={{ gap: theme.spacing['4'] }}>
        <Text variant="title">{t(TEXT.ibTitle)}</Text>
        <Text variant="label" color="secondary">
          {t(TEXT.ibDesc)}
        </Text>
      </View>

      <TaxSummaryLines summary={summary} />

      <Pressable
        accessibilityRole="button"
        onPress={handlePress}
        style={{ alignSelf: 'flex-end', paddingVertical: theme.spacing['4'] }}
      >
        <Text variant="label" color="accent" style={{ fontWeight: '600' }}>
          {t(TEXT.viewAnnual)} →
        </Text>
      </Pressable>
    </Card>
  );
}
