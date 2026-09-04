// `docs/12` §5: for potjes, animated, respects reduced motion. `docs/11` §13: numbers that
// change animate with a 300ms spring count-up on first render only, never on re-render.
import { type ReactNode, useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withSpring } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from './ThemeProvider';
import { useReducedMotion } from './useReducedMotion';

/* ── Types ────────────────────────────────────────────── */

export interface ProgressRingProps {
  /** Saved/target ratio. Values above 1 (over-saved) render as a full ring. */
  readonly value: number;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly children?: ReactNode;
  readonly testID: string;
  readonly accessibilityLabel: string;
}

/* ── Implementation ───────────────────────────────────── */

const LIMITS = { defaultSize: 56, defaultStrokeWidth: 6, animationMs: 300, springDampingRatio: 1 } as const;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressRing({
  value,
  size = LIMITS.defaultSize,
  strokeWidth = LIMITS.defaultStrokeWidth,
  children,
  testID,
  accessibilityLabel,
}: ProgressRingProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const clampedRatio = Math.max(0, Math.min(1, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(reducedMotion ? clampedRatio : 0);

  useEffect(() => {
    progress.value = reducedMotion
      ? clampedRatio
      : withSpring(clampedRatio, { duration: LIMITS.animationMs, dampingRatio: LIMITS.springDampingRatio });
    // First-render count-up only — intentionally excludes `clampedRatio` so a later prop
    // change snaps instead of re-animating (`docs/11` §13).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedRatio * 100) }}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.colors.bgSubtle} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.accentBg}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>
      {children}
    </View>
  );
}
