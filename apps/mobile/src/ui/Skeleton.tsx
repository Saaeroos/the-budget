// Loading placeholders that match the real layout's metrics (`docs/11` §State matrix). The
// shimmer stops entirely when the user has reduce-motion enabled (`docs/12` §10).
import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from './ThemeProvider';
import { useReducedMotion } from './useReducedMotion';

/* ── Types ────────────────────────────────────────────── */

export interface SkeletonProps {
  readonly width?: DimensionValue;
  readonly height?: number | undefined;
  readonly radius?: number;
  readonly style?: ViewStyle;
  readonly testID?: string;
}

export interface SkeletonGroupProps {
  readonly count: number;
  readonly height?: number;
  readonly gap?: number;
  readonly testID?: string;
}

/* ── Implementation ───────────────────────────────────── */

const PULSE = { min: 0.4, max: 1, durationMs: 800 } as const;
const DEFAULT_HEIGHT = 16;

export function Skeleton({ width = '100%', height = DEFAULT_HEIGHT, radius, style, testID }: SkeletonProps) {
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const opacity = useSharedValue<number>(PULSE.max);

  useEffect(() => {
    if (reduced) {
      opacity.value = PULSE.max;
      return;
    }
    opacity.value = withRepeat(withTiming(PULSE.min, { duration: PULSE.durationMs }), -1, true);
  }, [opacity, reduced]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { backgroundColor: theme.colors.bgSubtle, borderRadius: radius ?? theme.radius.sm, height, width },
        style,
        animated,
      ]}
    />
  );
}

export function SkeletonGroup({ count, height, gap, testID }: SkeletonGroupProps) {
  const { theme } = useTheme();
  return (
    <View style={[styles.group, { gap: gap ?? theme.spacing['12'] }]} testID={testID}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ group: { width: '100%' } });
