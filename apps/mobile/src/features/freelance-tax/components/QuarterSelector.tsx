import { Pressable, ScrollView } from 'react-native';
import { Text, useTheme } from '@/ui';
import type { QuarterNumber, TaxQuarter } from '../types';

/* ── Text ─────────────────────────────────────────────── */
// (labels come from quarter.label)

/* ── Types ────────────────────────────────────────────── */

export interface QuarterSelectorProps {
  readonly quarters: readonly TaxQuarter[];
  readonly selectedQuarter: QuarterNumber;
  readonly onSelectQuarter: (q: QuarterNumber) => void;
  readonly filedQuarters?: readonly QuarterNumber[] | undefined;
}

interface QuarterPillProps {
  readonly quarter: TaxQuarter;
  readonly isSelected: boolean;
  readonly isFiled: boolean;
  readonly onSelect: (q: QuarterNumber) => void;
}

/* ── Implementation ───────────────────────────────────── */

function getPillStyle(isSelected: boolean, isFiled: boolean, theme: ReturnType<typeof useTheme>['theme']) {
  if (isFiled && isSelected) {
    return {
      bg: theme.colors.statusPositive,
      border: theme.colors.statusPositive,
      textColor: 'inverse' as const,
      labelPrefix: '✓ ',
    };
  }
  if (isFiled) {
    return {
      bg: `${theme.colors.statusPositive}18`,
      border: theme.colors.statusPositive,
      textColor: 'positive' as const,
      labelPrefix: '✓ ',
    };
  }
  if (isSelected) {
    return {
      bg: theme.colors.accentBg,
      border: theme.colors.accentBg,
      textColor: 'inverse' as const,
      labelPrefix: '',
    };
  }
  return {
    bg: theme.colors.bgSurface,
    border: theme.colors.borderSubtle,
    textColor: 'primary' as const,
    labelPrefix: '',
  };
}

function QuarterPill({ quarter, isSelected, isFiled, onSelect }: QuarterPillProps) {
  const { theme } = useTheme();
  const style = getPillStyle(isSelected, isFiled, theme);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={isFiled ? `${quarter.label}, ingediend` : quarter.label}
      onPress={() => onSelect(quarter.quarter)}
      style={{
        paddingHorizontal: theme.spacing['16'],
        paddingVertical: theme.spacing['8'],
        borderRadius: theme.radius.full,
        backgroundColor: style.bg,
        borderWidth: 1,
        borderColor: style.border,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text
        variant="label"
        color={style.textColor}
        style={{ fontWeight: isSelected || isFiled ? '700' : '500' }}
      >
        {style.labelPrefix}{quarter.label}
      </Text>
    </Pressable>
  );
}

export function QuarterSelector({
  quarters,
  selectedQuarter,
  onSelectQuarter,
  filedQuarters = [],
}: QuarterSelectorProps) {
  const { theme } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: theme.spacing['8'],
        paddingVertical: theme.spacing['4'],
      }}
    >
      {quarters.map((q) => (
        <QuarterPill
          key={q.quarter}
          quarter={q}
          isSelected={q.quarter === selectedQuarter}
          isFiled={filedQuarters.includes(q.quarter)}
          onSelect={onSelectQuarter}
        />
      ))}
    </ScrollView>
  );
}
