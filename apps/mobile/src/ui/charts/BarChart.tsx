// `docs/12` §6: max 4 series, `border.subtle` gridlines, no animation on data change beyond
// 200ms, a text alternative via `accessibilityLabel`, a data table on long-press.
import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
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

const LIMITS = { defaultHeight: 160, gridDivisions: 4, maxSeries: 4 } as const;

function toDataRows(categories: readonly string[], series: readonly BarChartSeries[]) {
  return categories.flatMap((category, categoryIndex) =>
    series.map((s) => ({ label: `${s.label} · ${category}`, value: s.values[categoryIndex] ?? 0 })),
  );
}

function calculateBarLayout(width: number, categoriesCount: number, seriesCount: number) {
  if (categoriesCount === 0 || seriesCount === 0) {
    return { groupWidth: 0, barWidth: 0, innerGap: 0, totalGroupBarsWidth: 0 };
  }
  const groupWidth = width / categoriesCount;
  const innerGap = categoriesCount === 1 ? 24 : Math.min(14, Math.max(6, groupWidth * 0.08));
  const maxBarWidth = categoriesCount === 1 ? 44 : 32;
  const totalInnerGaps = (seriesCount - 1) * innerGap;
  const availableWidth = groupWidth * 0.75 - totalInnerGaps;
  const barWidth = Math.min(maxBarWidth, Math.max(14, availableWidth / seriesCount));
  const totalGroupBarsWidth = seriesCount * barWidth + totalInnerGaps;

  return { groupWidth, barWidth, innerGap, totalGroupBarsWidth };
}

interface ChartBarsProps {
  readonly categories: readonly string[];
  readonly series: readonly BarChartSeries[];
  readonly width: number;
  readonly height: number;
  readonly maxValue: number;
  readonly valueFormat: AxisValueFormat;
}

function ChartBars({ categories, series, width, height, maxValue, valueFormat }: ChartBarsProps) {
  const { theme } = useTheme();
  const topPadding = 24;
  const chartHeight = height - topPadding;
  const { groupWidth, barWidth, innerGap, totalGroupBarsWidth } = calculateBarLayout(
    width,
    categories.length,
    series.length,
  );

  return (
    <>
      {categories.map((_category, categoryIndex) => {
        const groupStartX = categoryIndex * groupWidth + (groupWidth - totalGroupBarsWidth) / 2;
        return series.map((s, seriesIndex) => {
          const value = s.values[categoryIndex] ?? 0;
          const barHeight = Math.max(4, (value / maxValue) * (chartHeight - 8));
          const x = groupStartX + seriesIndex * (barWidth + innerGap);
          const y = height - barHeight;
          const rx = Math.min(8, barWidth / 2, barHeight / 2);
          const formattedVal = valueFormat === 'money' ? `€${Math.round(value)}` : `${Math.round(value)}`;

          return (
            <G key={`${categoryIndex}-${seriesIndex}`}>
              {value > 0 ? (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 6}
                  fontSize={11}
                  fontWeight="600"
                  fill={theme.colors.textSecondary}
                  textAnchor="middle"
                >
                  {formattedVal}
                </SvgText>
              ) : null}
              <Rect x={x} y={y} width={barWidth} height={barHeight} rx={rx} ry={rx} fill={s.color} />
            </G>
          );
        });
      })}
    </>
  );
}

export function BarChart({ categories, series, valueFormat = 'money', height = LIMITS.defaultHeight, testID, accessibilityLabel }: BarChartProps) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const boundedSeries = series.slice(0, LIMITS.maxSeries);
  const maxValue = Math.max(1, ...boundedSeries.flatMap((s) => s.values));

  const handleLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

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
              <ChartBars categories={categories} series={boundedSeries} width={width} height={height} maxValue={maxValue} valueFormat={valueFormat} />
            </Svg>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
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
