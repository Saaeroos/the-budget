// `docs/12` §5: icon + name + bucket colour dot. The colour dot is never the only cue for the
// bucket — the icon and name always carry the meaning too (`docs/12` §2 "never colour alone").
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './Text';
import { useTheme } from './ThemeProvider';
import type { CategoryGroup } from './tokens';

/* ── Types ────────────────────────────────────────────── */

export interface CategoryChipProps {
  readonly name: string;
  readonly group: CategoryGroup;
  readonly icon: ReactNode;
  readonly selected?: boolean;
  readonly onPress?: () => void;
  readonly testID: string;
  readonly accessibilityLabel?: string;
}

/* ── Implementation ───────────────────────────────────── */

// The chip is visually compact but its tap target still meets the 44pt minimum via hitSlop
// rather than inflating the chip itself (`docs/12` §4).
const HIT_SLOP = { top: 10, bottom: 10, left: 6, right: 6 } as const;

export function CategoryChip({ name, group, icon, selected = false, onPress, testID, accessibilityLabel }: CategoryChipProps) {
  const { theme } = useTheme();
  const dotColor = theme.bucketColor[group];

  const chip = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing['8'],
        paddingHorizontal: theme.spacing['12'],
        paddingVertical: theme.spacing['8'],
        borderRadius: theme.radius.full,
        backgroundColor: selected ? theme.colors.accentSoft : theme.colors.bgSubtle,
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: theme.radius.full, backgroundColor: dotColor }} />
      {icon}
      <Text variant="label" color={selected ? 'accent' : 'primary'}>
        {name}
      </Text>
    </View>
  );

  if (!onPress) {
    return (
      <View testID={testID} accessibilityLabel={accessibilityLabel}>
        {chip}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? name}
      accessibilityState={{ selected }}
      testID={testID}
    >
      {chip}
    </Pressable>
  );
}
