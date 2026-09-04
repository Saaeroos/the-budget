// `docs/12` §5/§6: the single bucket donut — "no pie charts other than the single bucket
// donut", always the fixed four buckets in the fixed order and fixed colours.
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../ThemeProvider';
import { ChartDataTable } from './ChartDataTable';
import type { AxisValueFormat } from './formatAxisValue';

/* ── Types ────────────────────────────────────────────── */

const BUCKET_ORDER = ['vaste_lasten', 'reserveringen', 'huishoudelijk', 'vrij_besteedbaar'] as const;
export type DonutBucket = (typeof BUCKET_ORDER)[number];

export interface DonutSegment {
  readonly bucket: DonutBucket;
  readonly value: number;
}

export interface DonutChartProps {
  readonly segments: readonly DonutSegment[];
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly valueFormat?: AxisValueFormat;
  /** Rendered in the centre of the ring — the caller supplies the total, e.g. via `<Money>`. */
  readonly children?: ReactNode;
  readonly testID?: string;
  readonly accessibilityLabel: string;
}

interface Arc {
  readonly bucket: DonutBucket;
  readonly value: number;
  readonly offset: number;
}

/* ── Implementation ───────────────────────────────────── */

const LIMITS = { defaultSize: 160, defaultStrokeWidth: 20 } as const;

function orderedArcs(segments: readonly DonutSegment[]): readonly Arc[] {
  const byBucket = new Map(segments.map((segment) => [segment.bucket, segment.value]));
  let offset = 0;
  return BUCKET_ORDER.map((bucket) => {
    const value = byBucket.get(bucket) ?? 0;
    const arc: Arc = { bucket, value, offset };
    offset += value;
    return arc;
  });
}

interface DonutArcsProps {
  readonly arcs: readonly Arc[];
  readonly total: number;
  readonly size: number;
  readonly radius: number;
  readonly strokeWidth: number;
}

function DonutArcs({ arcs, total, size, radius, strokeWidth }: DonutArcsProps) {
  const { theme } = useTheme();
  if (total <= 0) return null;
  const circumference = 2 * Math.PI * radius;
  return (
    <>
      {arcs
        .filter((arc) => arc.value > 0)
        .map((arc) => {
          const arcLength = (arc.value / total) * circumference;
          return (
            <Circle
              key={arc.bucket}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.bucketColor[arc.bucket]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference - arcLength}`}
              strokeDashoffset={-((arc.offset / total) * circumference)}
              fill="none"
            />
          );
        })}
    </>
  );
}

export function DonutChart({
  segments,
  size = LIMITS.defaultSize,
  strokeWidth = LIMITS.defaultStrokeWidth,
  valueFormat = 'money',
  children,
  testID,
  accessibilityLabel,
}: DonutChartProps) {
  const { theme } = useTheme();
  const [showTable, setShowTable] = useState(false);
  const radius = (size - strokeWidth) / 2;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const arcs = orderedArcs(segments);

  return (
    <View testID={testID}>
      <Pressable onLongPress={() => setShowTable((v) => !v)} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
            <G>
              <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.colors.bgSubtle} strokeWidth={strokeWidth} fill="none" />
              <DonutArcs arcs={arcs} total={total} size={size} radius={radius} strokeWidth={strokeWidth} />
            </G>
          </Svg>
          {children}
        </View>
      </Pressable>
      {showTable ? <ChartDataTable rows={arcs.map((arc) => ({ label: arc.bucket, value: arc.value }))} valueFormat={valueFormat} /> : null}
    </View>
  );
}
