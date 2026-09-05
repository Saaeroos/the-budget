import { View } from 'react-native';
import type { Cents } from '@shared';
import { Card, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { FreelanceTaxSummary } from '@/features/budget';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  businessBalance: 'freelance.business_balance',
  trueTakeHome: 'freelance.true_take_home',
  trueTakeHomeDesc: 'freelance.true_take_home_desc',
  netBtwDue: 'freelance.net_btw_due',
  ibTitle: 'freelance.ib_title',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface FreelanceHeroCardProps {
  readonly summary: FreelanceTaxSummary;
}

/* ── Sub-components ───────────────────────────────────── */

function DeductionItem({ label, amount, isSubtract }: { readonly label: string; readonly amount: Cents; readonly isSubtract?: boolean }) {
  const { theme } = useTheme();

  return (
    <View style={{ gap: theme.spacing['2'] }}>
      <Text variant="label" color="secondary" numberOfLines={1}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {isSubtract && (
          <Text variant="label" color="secondary" style={{ marginRight: theme.spacing['2'] }}>
            -
          </Text>
        )}
        <Money cents={amount} variant="label" />
      </View>
    </View>
  );
}

function DeductionsRow({ summary }: { readonly summary: FreelanceTaxSummary }) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: theme.spacing['12'],
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderSubtle,
      }}
    >
      <DeductionItem label={t(TEXT.businessBalance)} amount={summary.businessBalance} />
      <DeductionItem label="BTW" amount={summary.netBtwDue} isSubtract />
      <DeductionItem label="IB buffer" amount={summary.incomeTaxReserve} isSubtract />
    </View>
  );
}

/* ── Component ────────────────────────────────────────── */

export function FreelanceHeroCard({ summary }: FreelanceHeroCardProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <Card padded style={{ gap: theme.spacing['16'], borderRadius: theme.radius.xl }}>
      <View style={{ gap: theme.spacing['4'] }}>
        <Text variant="label" color="accent" style={{ fontWeight: '600' }}>
          {t(TEXT.trueTakeHome)}
        </Text>
        <Money cents={summary.trueTakeHome} variant="display" />
        <Text variant="body" color="secondary">
          {t(TEXT.trueTakeHomeDesc)}
        </Text>
      </View>
      <DeductionsRow summary={summary} />
    </Card>
  );
}
