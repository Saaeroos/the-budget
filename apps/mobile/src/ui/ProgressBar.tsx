// `docs/12` §5: value/max, over-fill in amber with a distinct hatch pattern — never colour
// alone (`docs/12` §2, `.claude/rules/06-ui-and-styling.md` "meaning never carried by colour
// alone"). The hatch is a real, distinguishable texture, not just a different hue.
import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { clamp } from '@shared';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { useTheme } from './ThemeProvider';

/* ── Types ────────────────────────────────────────────── */

export interface ProgressBarProps {
  readonly value: number;
  readonly max: number;
  readonly testID: string;
  readonly accessibilityLabel: string;
}

/* ── Implementation ───────────────────────────────────── */

const LIMITS = { height: 8, overflowCapRatio: 1.4, hatchTile: 6, hatchStrokeWidth: 2 } as const;

interface OverflowHatchProps {
  readonly patternId: string;
  readonly left: number;
  readonly width: number;
}

/** The over-budget portion, drawn as a 45° hatch so the state is never colour-only (`docs/12` §2). */
function OverflowHatch({ patternId, left, width }: OverflowHatchProps) {
  const { theme } = useTheme();
  return (
    <Svg width={width} height={LIMITS.height} style={{ position: 'absolute', left, top: 0 }}>
      <Defs>
        <Pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width={LIMITS.hatchTile}
          height={LIMITS.hatchTile}
          patternTransform="rotate(45)"
        >
          <Rect width={LIMITS.hatchTile} height={LIMITS.hatchTile} fill={theme.colors.statusWarn} />
          <Rect width={LIMITS.hatchStrokeWidth} height={LIMITS.hatchTile} fill={theme.colors.bgCanvas} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </Svg>
  );
}

export function ProgressBar({ value, max, testID, accessibilityLabel }: ProgressBarProps) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);
  const ratio = max > 0 ? value / max : 0;
  const fillRatio = clamp(ratio, 0, 1);
  const isOver = ratio > 1;
  const overflowRatio = isOver ? clamp(ratio, 1, LIMITS.overflowCapRatio) - 1 : 0;
  const patternId = `progress-hatch-${testID}`;

  const handleLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(fillRatio * 100) }}
      onLayout={handleLayout}
      style={{ height: LIMITS.height, borderRadius: theme.radius.full, backgroundColor: theme.colors.bgSubtle }}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${fillRatio * 100}%`,
          borderRadius: theme.radius.full,
          backgroundColor: isOver ? theme.colors.statusWarn : theme.colors.accentBg,
        }}
      />
      {isOver && width > 0 ? (
        <OverflowHatch
          patternId={patternId}
          left={fillRatio * width}
          width={overflowRatio * width}
        />
      ) : null}
    </View>
  );
}
