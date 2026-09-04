// `docs/12` §5: padding, optional header/footer slots, press state. Cards use the `card`
// elevation by default (`docs/12` §4) — border + tiny shadow in light, a lighter surface with
// no shadow in dark.
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from './ThemeProvider';

/* ── Types ────────────────────────────────────────────── */

export type CardElevation = 'card' | 'raised';

export interface CardProps {
  readonly children: ReactNode;
  readonly header?: ReactNode;
  readonly footer?: ReactNode;
  readonly onPress?: () => void;
  readonly elevation?: CardElevation;
  readonly padded?: boolean;
  readonly testID?: string;
  readonly accessibilityLabel?: string;
}

/* ── Implementation ───────────────────────────────────── */

export function Card({ children, header, footer, onPress, elevation = 'card', padded = true, testID, accessibilityLabel }: CardProps) {
  const { theme } = useTheme();
  const containerStyle = [
    theme.elevation[elevation],
    {
      borderRadius: theme.radius.lg,
      padding: padded ? theme.spacing.cardPadding : 0,
      gap: theme.spacing['12'],
    },
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
