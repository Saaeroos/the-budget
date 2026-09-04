// `docs/12` §5: an inline micro-trend chart — no axes, no grid, one series. `docs/12` §6
// requires a one-sentence `accessibilityLabel`; the caller composes it since only it knows
// what the values mean.
import Svg, { Polyline } from 'react-native-svg';
import { useTheme } from '../ThemeProvider';

/* ── Types ────────────────────────────────────────────── */

export interface SparklineProps {
  readonly values: readonly number[];
  readonly width?: number;
  readonly height?: number;
  readonly testID?: string;
  readonly accessibilityLabel: string;
}

/* ── Implementation ───────────────────────────────────── */

const LIMITS = { defaultWidth: 96, defaultHeight: 32, strokeWidth: 2 } as const;

function toPoints(values: readonly number[], width: number, height: number): string {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');
}

export function Sparkline({ values, width = LIMITS.defaultWidth, height = LIMITS.defaultHeight, testID, accessibilityLabel }: SparklineProps) {
  const { theme } = useTheme();
  // `react-native-svg`'s own prop type declares `testID?: string` (no explicit `| undefined`),
  // so an optional value can only be forwarded via a conditional spread under
  // `exactOptionalPropertyTypes` — see docs/DECISIONS.md, 2026-09-04.
  const testIdProp = testID === undefined ? {} : { testID };

  return (
    <Svg width={width} height={height} {...testIdProp} accessibilityLabel={accessibilityLabel} accessible>
      <Polyline
        points={toPoints(values, width, height)}
        fill="none"
        stroke={theme.colors.accentBg}
        strokeWidth={LIMITS.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
