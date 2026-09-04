// `docs/12` §6: max 4 series, horizontal gridlines only ("no vertical grid on time series"),
// a text alternative, a data table on long-press.
import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';
import { Text } from '../Text';
import { useTheme } from '../ThemeProvider';
import { ChartDataTable } from './ChartDataTable';
import type { AxisValueFormat } from './formatAxisValue';

/* ── Types ────────────────────────────────────────────── */

export interface LineChartSeries {
  readonly label: string;
  readonly color: string;
  readonly points: readonly number[];
}

export interface LineChartProps {
  readonly categories: readonly string[];
  readonly series: readonly LineChartSeries[];
  readonly valueFormat?: AxisValueFormat;
  readonly height?: number;
  readonly testID?: string;
  readonly accessibilityLabel: string;
}

/* ── Implementation ───────────────────────────────────── */

const LIMITS = { defaultHeight: 160, gridDivisions: 4, maxSeries: 4, strokeWidth: 2 } as const;

function toDataRows(categories: readonly string[], series: readonly LineChartSeries[]) {
  return categories.flatMap((category, index) => series.map((s) => ({ label: `${s.label} · ${category}`, value: s.points[index] ?? 0 })));
}

export function LineChart({ categories, series, valueFormat = 'money', height = LIMITS.defaultHeight, testID, accessibilityLabel }: LineChartProps) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const boundedSeries = series.slice(0, LIMITS.maxSeries);
  const allValues = boundedSeries.flatMap((s) => s.points);
  const maxValue = Math.max(1, ...allValues);
  const minValue = Math.min(0, ...allValues);
  const range = maxValue - minValue || 1;

  const handleLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const step = categories.length > 1 ? width / (categories.length - 1) : 0;

  const toPolyline = (points: readonly number[]) =>
    points.map((value, index) => `${index * step},${height - ((value - minValue) / range) * height}`).join(' ');

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
              {boundedSeries.map((s) => (
                <Polyline key={s.label} points={toPolyline(s.points)} fill="none" stroke={s.color} strokeWidth={LIMITS.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
              ))}
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
