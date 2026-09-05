// `docs/12` §5: leading (icon/logo/avatar), title, subtitle, trailing (money/chevron/switch),
// swipe actions. A swipe reveals `leftActions`/`rightActions` — plain icon+label+onPress
// descriptors the feature layer supplies; `ListRow` only knows how to lay them out and reveal
// them (`.claude/rules/01-architecture.md` — no business meaning in `ui/`).
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { ListRowActions } from './ListRowActions';
import { Text } from './Text';
import { useReducedMotion } from './useReducedMotion';
import { useTheme } from './ThemeProvider';

/* ── Types ────────────────────────────────────────────── */

export interface ListRowAction {
  readonly key: string;
  readonly label: string;
  readonly icon: ReactNode;
  readonly tone: 'accent' | 'danger' | 'subtle';
  readonly onPress: () => void;
  readonly testID: string;
}

export interface ListRowProps {
  readonly leading?: ReactNode;
  readonly title: string;
  readonly subtitle?: string;
  readonly trailing?: ReactNode;
  readonly onPress?: () => void;
  readonly leftActions?: readonly ListRowAction[];
  readonly rightActions?: readonly ListRowAction[];
  readonly disabled?: boolean;
  readonly testID: string;
  readonly accessibilityLabel?: string;
}

/* ── Implementation ───────────────────────────────────── */

const LIMITS = { actionWidth: 72, dragActivationPx: 8, minHeight: 44, springDamping: 20 } as const;

interface SwipeGestureInput {
  readonly leftCount: number;
  readonly rightCount: number;
  readonly enabled: boolean;
}

/** Owns the swipe-to-action pan gesture and the row's transform, so `ListRow` stays composition. */
function useSwipeGesture({ leftCount, rightCount, enabled }: SwipeGestureInput) {
  const reducedMotion = useReducedMotion();
  const translateX = useSharedValue(0);
  const leftWidth = leftCount * LIMITS.actionWidth;
  const rightWidth = rightCount * LIMITS.actionWidth;

  const snap = (to: number) => {
    'worklet';
    translateX.value = reducedMotion ? withTiming(to, { duration: 0 }) : withSpring(to, { damping: LIMITS.springDamping });
  };

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-LIMITS.dragActivationPx, LIMITS.dragActivationPx])
    .onChange((event) => {
      const next = translateX.value + event.changeX;
      translateX.value = Math.max(-rightWidth, Math.min(leftWidth, next));
    })
    .onEnd(() => {
      const at = translateX.value;
      if (at > leftWidth / 2) snap(leftWidth);
      else if (at < -rightWidth / 2) snap(-rightWidth);
      else snap(0);
    });

  const rowStyle = useAnimatedStyle<ViewStyle>(() => ({ transform: [{ translateX: translateX.value }] }));
  return { pan, rowStyle };
}

interface RowContentProps {
  readonly rowStyle: ReturnType<typeof useAnimatedStyle<ViewStyle>>;
  readonly leading?: ReactNode | undefined;
  readonly title: string;
  readonly subtitle?: string | undefined;
  readonly trailing?: ReactNode | undefined;
}

function RowContent({ rowStyle, leading, title, subtitle, trailing }: RowContentProps) {
  const { theme } = useTheme();
  return (
    <Animated.View
      style={[
        rowStyle,
        {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: LIMITS.minHeight,
          paddingHorizontal: theme.spacing['16'],
          paddingVertical: theme.spacing['12'],
          gap: theme.spacing['12'],
          backgroundColor: theme.colors.bgSurface,
        },
      ]}
    >
      {leading}
      <View style={{ flex: 1, gap: theme.spacing['2'] }}>
        <Text variant="body" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="label" color="secondary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </Animated.View>
  );
}

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  leftActions = [],
  rightActions = [],
  disabled = false,
  testID,
  accessibilityLabel,
}: ListRowProps) {
  const canSwipe = leftActions.length > 0 || rightActions.length > 0;
  const { pan, rowStyle } = useSwipeGesture({
    leftCount: leftActions.length,
    rightCount: rightActions.length,
    enabled: canSwipe && !disabled,
  });

  const content = (
    <RowContent rowStyle={rowStyle} leading={leading} title={title} subtitle={subtitle} trailing={trailing} />
  );

  const row = onPress ? (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={accessibilityLabel} testID={testID}>
      {content}
    </Pressable>
  ) : (
    <View accessibilityLabel={accessibilityLabel} testID={testID}>
      {content}
    </View>
  );

  if (!canSwipe) return row;

  return (
    <View style={{ overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0 }}>
        <ListRowActions actions={leftActions} actionWidth={LIMITS.actionWidth} />
      </View>
      <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0 }}>
        <ListRowActions actions={rightActions} actionWidth={LIMITS.actionWidth} />
      </View>
      <GestureDetector gesture={pan}>{row}</GestureDetector>
    </View>
  );
}
