import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

/* ── Types ────────────────────────────────────────────── */

export interface FadeInViewProps {
  readonly children: ReactNode;
  readonly delay?: number;
  readonly index?: number;
  readonly style?: StyleProp<ViewStyle>;
  readonly duration?: number;
}

/* ── Implementation ───────────────────────────────────── */

export function FadeInView({
  children,
  delay = 0,
  index = 0,
  style,
  duration = 350,
}: FadeInViewProps) {
  const calculatedDelay = delay + index * 60;

  return (
    <Animated.View
      entering={FadeInDown.duration(duration).delay(calculatedDelay)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
