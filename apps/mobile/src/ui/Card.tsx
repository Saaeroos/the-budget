// `docs/12` §5: padding, optional header/footer slots, press state. Cards use the `card`
// elevation by default (`docs/12` §4) — border + tiny shadow in light, a lighter surface with
// no shadow in dark.
import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from './ThemeProvider';

/* ── Types ────────────────────────────────────────────── */

export type CardElevation = 'card' | 'raised';

export interface CardProps {
  readonly children: ReactNode;
  readonly header?: ReactNode | undefined;
  readonly footer?: ReactNode | undefined;
  readonly onPress?: (() => void) | undefined;
  readonly elevation?: CardElevation | undefined;
  readonly padded?: boolean | undefined;
  readonly style?: StyleProp<ViewStyle> | undefined;
  readonly testID?: string | undefined;
  readonly accessibilityLabel?: string | undefined;
}

/* ── Implementation ───────────────────────────────────── */

export function Card({ children, header, footer, onPress, elevation = 'card', padded = true, style, testID, accessibilityLabel }: CardProps) {
  const { theme } = useTheme();
  const containerStyle = [
    theme.elevation[elevation],
    {
      borderRadius: theme.radius.lg,
      padding: padded ? theme.spacing.cardPadding : 0,
      gap: theme.spacing['12'],
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={({ pressed }) => [...containerStyle, { opacity: pressed ? 0.9 : 1 }]}
      >
        {header}
        {children}
        {footer}
      </Pressable>
    );
  }

  return (
    <View style={containerStyle} testID={testID} accessibilityLabel={accessibilityLabel}>
      {header}
      {children}
      {footer}
    </View>
  );
}
