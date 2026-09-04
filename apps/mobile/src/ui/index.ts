// The public barrel for `@/ui` — the design system contract every feature imports through.
// Lists only what is public, per `.claude/rules/01-architecture.md` ("no barrel re-export of
// a whole directory — list what is public explicitly").

export { ThemeProvider, useTheme, type ThemeOverride, type ThemeProviderProps } from './ThemeProvider';
export { tokens, type Theme, type ColorScheme, type CategoryGroup, type TypeVariant } from './tokens';

export { Text, type TextProps, type TextColorToken } from './Text';
export { Money, type MoneyProps, type MoneySign } from './Money';
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button';
export { Card, type CardProps, type CardElevation } from './Card';
export { ListRow, type ListRowProps, type ListRowAction } from './ListRow';
export { CategoryChip, type CategoryChipProps } from './CategoryChip';
export { ProgressBar, type ProgressBarProps } from './ProgressBar';
export { ProgressRing, type ProgressRingProps } from './ProgressRing';
export { AmountInput, type AmountInputProps } from './AmountInput';
export { Sheet, type SheetProps, type SheetHandle } from './Sheet';
export { SegmentedControl, type SegmentedControlProps, type SegmentedControlOption } from './SegmentedControl';
export { EmptyState, type EmptyStateProps, type EmptyStateAction } from './EmptyState';
export { Banner, type BannerProps, type BannerTone, type BannerAction } from './Banner';
export { Skeleton, SkeletonGroup, type SkeletonProps, type SkeletonGroupProps } from './Skeleton';

export { DonutChart, type DonutChartProps, type DonutSegment, type DonutBucket } from './charts/DonutChart';
export { BarChart, type BarChartProps, type BarChartSeries } from './charts/BarChart';
export { LineChart, type LineChartProps, type LineChartSeries } from './charts/LineChart';
export { Sparkline, type SparklineProps } from './charts/Sparkline';
export type { AxisValueFormat } from './charts/formatAxisValue';

export { CATEGORY_ICON, type CategoryIconKey } from './icons/categories';
