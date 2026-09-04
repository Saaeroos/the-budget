// Internal to `ListRow` — renders the row of action buttons revealed behind a swipe
// (`docs/12` §5 "swipe actions"; the actions themselves — categoriseren, uitsluiten, … —
// are business behaviour and stay in feature code, which only supplies icon/label/onPress).
import { Pressable, View } from 'react-native';
import { Text } from './Text';
import { useTheme } from './ThemeProvider';
import type { Theme } from './tokens';
import type { ListRowAction } from './ListRow';

/* ── Types ────────────────────────────────────────────── */

export interface ListRowActionsProps {
  readonly actions: readonly ListRowAction[];
  readonly actionWidth: number;
}

/* ── Implementation ───────────────────────────────────── */

function backgroundFor(theme: Theme, tone: ListRowAction['tone']): string {
  if (tone === 'danger') return theme.colors.statusDanger;
  if (tone === 'accent') return theme.colors.accentBg;
  return theme.colors.bgSubtle;
}

function foregroundFor(theme: Theme, tone: ListRowAction['tone']): string {
  if (tone === 'danger') return theme.colors.textInverse;
  if (tone === 'accent') return theme.colors.accentFg;
  return theme.colors.textPrimary;
}

export function ListRowActions({ actions, actionWidth }: ListRowActionsProps) {
  const { theme } = useTheme();

  return (
    <View style={{ flexDirection: 'row', height: '100%' }}>
      {actions.map((action) => (
        <Pressable
          key={action.key}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          testID={action.testID}
          style={{
            width: actionWidth,
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing['4'],
            backgroundColor: backgroundFor(theme, action.tone),
          }}
        >
          {action.icon}
          <Text variant="label" style={{ color: foregroundFor(theme, action.tone) }}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
