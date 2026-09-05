import { View } from 'react-native';
import { cents, type Cents } from '@shared';
import { Money, Text, useTheme } from '@/ui';

/* ── Text ─────────────────────────────────────────────── */
// (labels are passed in from caller via i18n)

/* ── Types ────────────────────────────────────────────── */

export interface RubriekRowProps {
  readonly code: string;
  readonly label: string;
  readonly amountCents: Cents;
  readonly secondaryAmountCents?: Cents | undefined;
  readonly secondaryLabel?: string | undefined;
  readonly isTotal?: boolean | undefined;
  readonly isNegative?: boolean | undefined;
  readonly testID?: string | undefined;
}

/* ── Helpers ──────────────────────────────────────────── */

function getRubriekStyle(isTotal?: boolean) {
  if (isTotal) {
    return { py: 8, border: 1, textVariant: 'body' as const, moneyVariant: 'title' as const, isBold: true };
  }
  return { py: 4, border: 0, textVariant: 'label' as const, moneyVariant: 'body' as const, isBold: false };
}

function SecondaryLine({ label, amount }: { readonly label?: string | undefined; readonly amount?: Cents | undefined }) {
  const { theme } = useTheme();
  if (!label || amount === undefined) return null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing['4'], marginTop: theme.spacing['2'] }}>
      <Text variant="label" color="secondary" style={{ fontSize: 11 }}>
        {label}:
      </Text>
      <Money cents={amount} variant="label" color="secondary" />
    </View>
  );
}

/* ── Implementation ───────────────────────────────────── */

export function RubriekRow({
  code,
  label,
  amountCents,
  secondaryAmountCents,
  secondaryLabel,
  isTotal,
  isNegative,
  testID,
}: RubriekRowProps) {
  const { theme } = useTheme();
  const cfg = getRubriekStyle(isTotal);
  const displayAmount = isNegative ? cents(-Math.abs(amountCents)) : amountCents;

  return (
    <View
      testID={testID ?? `rubriek-row-${code}`}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: cfg.py,
        borderTopWidth: cfg.border,
        borderTopColor: theme.colors.borderSubtle,
      }}
    >
      <View style={{ flex: 1, marginRight: theme.spacing['12'] }}>
        <Text variant={cfg.textVariant} color={cfg.isBold ? 'primary' : 'secondary'}>
          {label}
        </Text>
        <SecondaryLine label={secondaryLabel} amount={secondaryAmountCents} />
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Money cents={displayAmount} variant={cfg.moneyVariant} color="primary" />
      </View>
    </View>
  );
}
