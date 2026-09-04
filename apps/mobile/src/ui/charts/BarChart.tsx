// `docs/12` §6: max 4 series, `border.subtle` gridlines, no animation on data change beyond
// 200ms, a text alternative via `accessibilityLabel`, a data table on long-press.
import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { Text } from '../Text';
import { useTheme } from '../ThemeProvider';
import { ChartDataTable } from './ChartDataTable';
import type { AxisValueFormat } from './formatAxisValue';

/* ── Types ────────────────────────────────────────────── */

export interface BarChartSeries {
  readonly label: string;
  readonly color: string;
  readonly values: readonly number[];
}

export interface BarChartProps {
  readonly categories: readonly string[];
  readonly series: readonly BarChartSeries[];
  readonly valueFormat?: AxisValueFormat;
  readonly height?: number;
  readonly testID?: string;
  readonly accessibilityLabel: string;
}

/* ── Implementation ───────────────────────────────────── */

const LIMITS = { defaultHeight: 160, gridDivisions: 4, maxSeries: 4, barGapRatio: 0.3 } as const;

function toDataRows(categories: readonly string[], series: readonly BarChartSeries[]) {
  return categories.flatMap((category, categoryIndex) =>
    series.map((s) => ({ label: `${s.label} · ${category}`, value: s.values[categoryIndex] ?? 0 })),
  );
}

export function BarChart({ categories, series, valueFormat = 'money', height = LIMITS.defaultHeight, testID, accessibilityLabel }: BarChartProps) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const boundedSeries = series.slice(0, LIMITS.maxSeries);
  const maxValue = Math.max(1, ...boundedSeries.flatMap((s) => s.values));

  const handleLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const groupWidth = categories.length > 0 ? width / categories.length : 0;
  const barSlotWidth = boundedSeries.length > 0 ? (groupWidth * (1 - LIMITS.barGapRatio)) / boundedSeries.length : 0;

  return (
    <View testID={testID}>
      <Pressable onLongPress={() => setShowTable((v) => !v)} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <View onLayout={handleLayout} style={{ height }}>
          {width > 0 ? (
            <Svg width={width} height={height}>
              {Array.from({ length: LIMITS.gridDivisions + 1 }, (_, i) => {
                const y = (height / LIMITS.gridDivisions) * i;
                return <Line key={i} x1={0} y1={y} x2={width} y2={y} stroke={theme.colors.borderSubtle} strokeWidth={1} />;
              })}
              {categories.map((_category, categoryIndex) =>
                boundedSeries.map((s, seriesIndex) => {
                  const value = s.values[categoryIndex] ?? 0;
                  const barHeight = (value / maxValue) * height;
                  const x = categoryIndex * groupWidth + groupWidth * (LIMITS.barGapRatio / 2) + seriesIndex * barSlotWidth;
                  return <Rect key={`${categoryIndex}-${seriesIndex}`} x={x} y={height - barHeight} width={barSlotWidth} height={barHeight} fill={s.color} />;
                }),
              )}
            </Svg>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row' }}>
          {categories.map((category) => (
            <Text key={category} variant="label" color="secondary" style={{ flex: 1, textAlign: 'center' }}>
              {category}
            </Text>
          ))}
        </View>
      </Pressable>
      {showTable ? <ChartDataTable rows={toDataRows(categories, boundedSeries)} valueFormat={valueFormat} /> : null}
    </View>
  );
}
