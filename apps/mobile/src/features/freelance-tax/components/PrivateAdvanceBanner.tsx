import { View } from 'react-native';
import { Card, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { Cents } from '@shared';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'freelance.private_advance_title',
  description: 'freelance.private_advance_desc',
  reimbursementAvailable: 'freelance.reimbursement_available',
} as const;

/* ── Types ────────────────────────────────────────────── */
export interface PrivateAdvanceBannerProps {
  readonly pendingCents: Cents;
  readonly onPayoutPress?: () => void;
}

/* ── Implementation ───────────────────────────────────── */
export function PrivateAdvanceBanner({ pendingCents, onPayoutPress }: PrivateAdvanceBannerProps) {
  const t = useT();
  const { theme } = useTheme();

  if (pendingCents <= 0) {
    return null;
  }

  const pressProps = onPayoutPress != null ? { onPress: onPayoutPress } : {};

  return (
    <Card
      {...pressProps}
      style={{
        padding: theme.spacing['16'],
        gap: theme.spacing['8'],
        backgroundColor: `${theme.colors.statusPositive}12`,
        borderWidth: 1,
        borderColor: `${theme.colors.statusPositive}30`,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="title" color="positive">
          {t(TEXT.title)}
        </Text>
        <Money cents={pendingCents} variant="title" color="positive" />
      </View>

      <Text variant="label" color="secondary">
        {t(TEXT.description)}
      </Text>
    </Card>
  );
}
