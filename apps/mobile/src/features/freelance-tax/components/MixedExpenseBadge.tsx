import { View } from 'react-native';
import { Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { ExpenseCategoryKind } from '@shared';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  horeca: 'freelance.badge_horeca_limited',
  telecom: 'freelance.badge_telecom_split',
  workspace: 'freelance.badge_workspace_nondeductible',
  privateAdvance: 'freelance.badge_private_advance',
} as const;

/* ── Types ────────────────────────────────────────────── */
export interface MixedExpenseBadgeProps {
  readonly kind: ExpenseCategoryKind | 'private_advance';
}

function getBadgeLabel(kind: ExpenseCategoryKind | 'private_advance', t: (k: string) => string): string {
  if (kind === 'private_advance') return t(TEXT.privateAdvance);
  if (kind === 'horeca') return t(TEXT.horeca);
  if (kind === 'telecom') return t(TEXT.telecom);
  if (kind === 'workspace') return t(TEXT.workspace);
  return 'Zakelijk';
}

/* ── Implementation ───────────────────────────────────── */
export function MixedExpenseBadge({ kind }: MixedExpenseBadgeProps) {
  const t = useT();
  const { theme } = useTheme();

  const isHoreca = kind === 'horeca';
  const isAdvance = kind === 'private_advance';
  const label = getBadgeLabel(kind, t);

  const bg = isAdvance
    ? `${theme.colors.statusPositive}18`
    : isHoreca
      ? `${theme.colors.statusDanger}18`
      : theme.colors.bgSubtle;

  const color = isAdvance ? 'positive' : isHoreca ? 'danger' : 'secondary';

  return (
    <View
      accessibilityRole="text"
      style={{
        paddingHorizontal: theme.spacing['8'],
        paddingVertical: theme.spacing['2'],
        borderRadius: theme.radius.sm,
        backgroundColor: bg,
        alignSelf: 'flex-start',
      }}
    >
      <Text variant="label" color={color} style={{ fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}
