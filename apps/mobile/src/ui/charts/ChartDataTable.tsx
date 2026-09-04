// `docs/12` §6: "every chart has ... a data table available on long-press." Shared by
// `DonutChart`, `BarChart` and `LineChart` (a `Sparkline` is a glance-only inline indicator
// with no axis semantics, so it is exempt — docs/DECISIONS.md, 2026-09-04).
import { View } from 'react-native';
import { Text } from '../Text';
import { useTheme } from '../ThemeProvider';
import { formatAxisValue, type AxisValueFormat } from './formatAxisValue';

/* ── Types ────────────────────────────────────────────── */

export interface ChartDataRow {
  readonly label: string;
  readonly value: number;
}

export interface ChartDataTableProps {
  readonly rows: readonly ChartDataRow[];
  readonly valueFormat: AxisValueFormat;
  readonly testID?: string;
}

/* ── Implementation ───────────────────────────────────── */

export function ChartDataTable({ rows, valueFormat, testID }: ChartDataTableProps) {
  const { theme } = useTheme();

  return (
    <View testID={testID} accessibilityRole="none" style={{ gap: theme.spacing['4'], marginTop: theme.spacing['8'] }}>
      {rows.map((row) => (
        <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="label" color="secondary">
            {row.label}
          </Text>
          <Text variant="label" style={{ fontVariant: ['tabular-nums'] }}>
            {formatAxisValue(row.value, valueFormat)}
          </Text>
        </View>
      ))}
    </View>
  );
}
