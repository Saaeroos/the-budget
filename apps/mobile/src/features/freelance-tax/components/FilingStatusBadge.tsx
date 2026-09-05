import { View } from 'react-native';
import { Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { FilingStatus } from '../types';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  draft: 'freelance.filing_draft',
  ready: 'freelance.filing_ready',
  filed: 'freelance.filing_filed',
  paid: 'freelance.filing_paid',
  inProgress: 'freelance.filing_in_progress',
} as const;

/* ── Types ────────────────────────────────────────────── */

export interface FilingStatusBadgeProps {
  readonly status: FilingStatus;
}

interface BadgeConfig {
  readonly labelKey: string;
  readonly textColor: 'secondary' | 'positive' | 'accent';
}

/* ── Constants ────────────────────────────────────────── */

const BADGE_CONFIG: Readonly<Record<FilingStatus, BadgeConfig>> = {
  ready: { labelKey: TEXT.ready, textColor: 'accent' },
  filed: { labelKey: TEXT.filed, textColor: 'positive' },
  paid: { labelKey: TEXT.paid, textColor: 'positive' },
  in_progress: { labelKey: TEXT.inProgress, textColor: 'secondary' },
  draft: { labelKey: TEXT.draft, textColor: 'secondary' },
};

/* ── Implementation ───────────────────────────────────── */

export function FilingStatusBadge({ status }: FilingStatusBadgeProps) {
  const t = useT();
  const { theme } = useTheme();

  const config = BADGE_CONFIG[status] ?? BADGE_CONFIG.draft;
  const label = t(config.labelKey);
  const isFiled = status === 'filed' || status === 'paid';

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={{
        paddingHorizontal: theme.spacing['8'],
        paddingVertical: theme.spacing['4'],
        borderRadius: theme.radius.sm,
        backgroundColor: isFiled ? `${theme.colors.statusPositive}18` : theme.colors.bgSubtle,
        borderWidth: isFiled ? 1 : 0,
        borderColor: theme.colors.statusPositive,
        alignSelf: 'flex-start',
      }}
    >
      <Text variant="label" color={config.textColor} style={{ fontWeight: '600' }}>
        {isFiled ? `✓ ${label}` : label}
      </Text>
    </View>
  );
}
