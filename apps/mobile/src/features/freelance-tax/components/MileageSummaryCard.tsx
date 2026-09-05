import { View } from 'react-native';
import { Card, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { Cents } from '@shared';
import type { MileageSummary } from '../types';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'freelance.mileage_title',
  totalAllowance: 'freelance.mileage_total_allowance',
  rateNotice: 'freelance.mileage_rate_notice',
  totalKm: 'freelance.mileage_total_km',
  pendingPayout: 'freelance.mileage_pending_payout',
} as const;

/* ── Types ────────────────────────────────────────────── */
export interface MileageSummaryCardProps {
  readonly summary: MileageSummary;
  readonly onOpenDetails?: () => void;
}

function PendingPayoutRow({ pendingCents }: { readonly pendingCents: Cents }) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: theme.spacing['8'],
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderSubtle,
      }}
    >
      <Text variant="body" color="secondary">{t(TEXT.pendingPayout)}</Text>
      <Money cents={pendingCents} variant="title" color="accent" />
    </View>
  );
}

/* ── Implementation ───────────────────────────────────── */
export function MileageSummaryCard({ summary, onOpenDetails }: MileageSummaryCardProps) {
  const t = useT();
  const { theme } = useTheme();

  const pressProps = onOpenDetails != null ? { onPress: onOpenDetails } : {};

  return (
    <Card
      {...pressProps}
      accessibilityLabel={`${t(TEXT.title)}: ${summary.totalDistanceKm} km`}
      style={{
        padding: theme.spacing['16'],
        gap: theme.spacing['12'],
        backgroundColor: theme.colors.bgSurface,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="title" color="primary">{t(TEXT.title)}</Text>
        <Text variant="label" color="secondary">{t(TEXT.rateNotice)}</Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <View style={{ gap: theme.spacing['4'] }}>
          <Text variant="label" color="secondary">{t(TEXT.totalKm)}</Text>
          <Text variant="title" color="primary">{summary.totalDistanceKm.toFixed(1)} km</Text>
        </View>

        <View style={{ alignItems: 'flex-end', gap: theme.spacing['4'] }}>
          <Text variant="label" color="secondary">{t(TEXT.totalAllowance)}</Text>
          <Money cents={summary.totalAllowanceCents} variant="title" color="positive" />
        </View>
      </View>

      {summary.pendingReimbursementCents > 0 && (
        <PendingPayoutRow pendingCents={summary.pendingReimbursementCents} />
      )}
    </Card>
  );
}
