import { View } from 'react-native';
import { Text, useTheme } from '@/ui';
import { useT } from '@/i18n';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  disclaimer: 'freelance.disclaimer',
} as const;

/* ── Types ────────────────────────────────────────────── */

export interface TaxDisclaimerProps {
  readonly testID?: string | undefined;
}

/* ── Implementation ───────────────────────────────────── */

export function TaxDisclaimer({ testID }: TaxDisclaimerProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View
      testID={testID}
      style={{
        padding: theme.spacing['12'],
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.bgSubtle,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.accentBg,
      }}
    >
      <Text variant="label" color="secondary" style={{ fontSize: 11, lineHeight: 16 }}>
        ℹ️ {t(TEXT.disclaimer)}
      </Text>
    </View>
  );
}
