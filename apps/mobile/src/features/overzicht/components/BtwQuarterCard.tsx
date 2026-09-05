import { Pressable, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { cents, type Cents } from '@shared';
import { Card, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { useBudgetStore, type FreelanceTaxSummary } from '@/features/budget';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  btwQuarter: 'freelance.btw_quarter',
  btwDeadline: 'freelance.btw_deadline',
  btwCollected: 'freelance.btw_collected',
  btwPaid: 'freelance.btw_paid',
  netBtwDue: 'freelance.net_btw_due',
  taxReservedBadge: 'freelance.tax_reserved_badge',
  viewAangifte: 'freelance.view_btw_aangifte',
  filingFiled: 'freelance.filing_filed',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface BtwQuarterCardProps {
  readonly summary: FreelanceTaxSummary;
  readonly onPress?: (() => void) | undefined;
}

/* ── Sub-components ───────────────────────────────────── */

function BtwLineRow({
  label,
  amount,
  isNegative,
  isBold,
}: {
  readonly label: string;
  readonly amount: Cents;
  readonly isNegative?: boolean;
  readonly isBold?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text variant="body" color={isBold ? 'primary' : 'secondary'} style={{ fontWeight: isBold ? '600' : '400' }}>
        {label}
      </Text>
      <Money
        cents={cents(isNegative ? -Math.abs(amount) : amount)}
        variant={isBold ? 'body-lg' : 'body'}
        color={isBold ? 'primary' : 'secondary'}
      />
    </View>
  );
}

function BtwFundedPill({ isFunded }: { readonly isFunded: boolean }) {
  const t = useT();
  const { theme } = useTheme();

  if (!isFunded) return null;

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing['8'],
        paddingVertical: theme.spacing['4'],
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.bgSubtle,
        alignSelf: 'flex-start',
      }}
    >
      <Text variant="label" color="positive" style={{ fontWeight: '600' }}>
        ✓ {t(TEXT.taxReservedBadge)}
      </Text>
    </View>
  );
}

function BtwCardHeader({
  quarterName,
  filingDeadline,
  daysUntilDeadline,
  isFiled,
}: {
  readonly quarterName: string;
  readonly filingDeadline: string;
  readonly daysUntilDeadline: number;
  readonly isFiled: boolean;
}) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <View style={{ gap: theme.spacing['4'] }}>
        <Text variant="title">{t(TEXT.btwQuarter, { quarter: quarterName })}</Text>
        <Text variant="label" color="secondary">
          {t(TEXT.btwDeadline, { date: filingDeadline, days: daysUntilDeadline })}
        </Text>
      </View>
      {isFiled && (
        <View
          style={{
            paddingHorizontal: theme.spacing['8'],
            paddingVertical: theme.spacing['4'],
            borderRadius: theme.radius.sm,
            backgroundColor: `${theme.colors.statusPositive}18`,
            borderWidth: 1,
            borderColor: theme.colors.statusPositive,
          }}
        >
          <Text variant="label" color="positive" style={{ fontWeight: '600' }}>
            ✓ {t(TEXT.filingFiled)}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ── Component ────────────────────────────────────────── */

export function BtwQuarterCard({ summary, onPress }: BtwQuarterCardProps) {
  const t = useT();
  const router = useRouter();
  const { theme } = useTheme();

  const filedQuarters = useBudgetStore((s) => s.filedBtwQuarters ?? []);
  const isFiled = filedQuarters.includes(summary.currentQuarter.quarter);
  const handlePress = onPress ?? (() => router.push('/zakelijk/btw-aangifte' as Href<string>));

  return (
    <Card
      padded
      style={{
        gap: theme.spacing['16'],
        borderRadius: theme.radius.xl,
        borderWidth: 1.5,
        borderColor: isFiled ? theme.colors.statusPositive : theme.colors.borderSubtle,
      }}
    >
      <BtwCardHeader
        quarterName={summary.quarterName}
        filingDeadline={summary.filingDeadline}
        daysUntilDeadline={summary.daysUntilDeadline}
        isFiled={isFiled}
      />

      <View style={{ gap: theme.spacing['8'] }}>
        <BtwLineRow label={t(TEXT.btwCollected)} amount={summary.btwCollected} />
        <BtwLineRow label={t(TEXT.btwPaid)} amount={summary.btwPaid} isNegative />
        <View style={{ height: 1, backgroundColor: theme.colors.borderSubtle, marginVertical: theme.spacing['4'] }} />
        <BtwLineRow label={t(TEXT.netBtwDue)} amount={summary.netBtwDue} isBold />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <BtwFundedPill isFunded={summary.isBtwFunded} />
        <Pressable accessibilityRole="button" onPress={handlePress} style={{ paddingVertical: theme.spacing['4'] }}>
          <Text variant="label" color="accent" style={{ fontWeight: '600' }}>
            {t(TEXT.viewAangifte)} →
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}
