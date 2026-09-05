import { View } from 'react-native';
import { PiggyBank } from 'lucide-react-native';
import { cents, type Cents } from '@shared';
import { Card, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { LocalEnvelope } from '@/features/budget';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  totalSaved: 'potjes.total_saved',
  thisMonth: 'potjes.this_month',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface PotjesSummaryCardProps {
  readonly envelopes: readonly LocalEnvelope[];
}

/* ── Component ────────────────────────────────────────── */

export function PotjesSummaryCard({ envelopes }: PotjesSummaryCardProps) {
  const t = useT();
  const { theme } = useTheme();

  const totalSavedRaw = envelopes.reduce((sum, e) => sum + e.currentCents, 0);
  const totalMonthlyRaw = envelopes.reduce((sum, e) => sum + e.monthlyCents, 0);

  const totalSavedCents: Cents = cents(totalSavedRaw);
  const totalMonthlyCents: Cents = cents(totalMonthlyRaw);

  return (
    <Card padded style={{ gap: theme.spacing['12'], backgroundColor: theme.colors.bgSurfaceRaised }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing['12'] }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PiggyBank size={24} color={theme.colors.accentBg} strokeWidth={2} />
          </View>
          <View style={{ gap: theme.spacing['2'] }}>
            <Text variant="label" color="secondary">
              {t(TEXT.totalSaved)}
            </Text>
            <Money cents={totalSavedCents} variant="title" />
          </View>
        </View>
        <View style={{ gap: theme.spacing['2'], alignItems: 'flex-end' }}>
          <Text variant="label" color="secondary">
            {t(TEXT.thisMonth)}
          </Text>
          <Money cents={totalMonthlyCents} variant="title" />
        </View>
      </View>
    </Card>
  );
}
