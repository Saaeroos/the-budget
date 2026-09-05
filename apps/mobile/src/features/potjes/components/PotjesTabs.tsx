import { Pressable, View } from 'react-native';
import { Text, useTheme } from '@/ui';
import { useT } from '@/i18n';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  all: 'potjes.tabs_all',
  yearly: 'potjes.tabs_yearly',
} as const;

/* ── Types ────────────────────────────────────────────── */

export type PotjesTab = 'all' | 'yearly';

interface PotjesTabsProps {
  readonly activeTab: PotjesTab;
  readonly onSelectTab: (tab: PotjesTab) => void;
  readonly envelopeCount: number;
  readonly yearlyCount: number;
}

interface PotjesTabButtonProps {
  readonly label: string;
  readonly count: number;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
}

function PotjesTabButton({ label, count, isSelected, onSelect }: PotjesTabButtonProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onSelect}
      style={{
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing['8'],
        paddingVertical: theme.spacing['8'],
        borderRadius: theme.radius.full,
        backgroundColor: isSelected ? theme.colors.bgSurface : 'transparent',
      }}
    >
      <Text variant="label" color={isSelected ? 'primary' : 'secondary'}>
        {label}
      </Text>
      <View
        style={{
          paddingHorizontal: theme.spacing['8'],
          paddingVertical: 1,
          borderRadius: theme.radius.full,
          backgroundColor: isSelected ? theme.colors.accentBg : theme.colors.borderSubtle,
        }}
      >
        <Text variant="label" color={isSelected ? 'inverse' : 'secondary'}>
          {String(count)}
        </Text>
      </View>
    </Pressable>
  );
}

/* ── Component ────────────────────────────────────────── */

export function PotjesTabs({
  activeTab,
  onSelectTab,
  envelopeCount,
  yearlyCount,
}: PotjesTabsProps) {
  const t = useT();
  const { theme } = useTheme();

  const tabs: readonly { key: PotjesTab; label: string; count: number }[] = [
    { key: 'all', label: t(TEXT.all), count: envelopeCount },
    { key: 'yearly', label: t(TEXT.yearly), count: yearlyCount },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.bgSubtle,
        borderRadius: theme.radius.full,
        padding: theme.spacing['4'],
        gap: theme.spacing['4'],
      }}
    >
      {tabs.map((tab) => (
        <PotjesTabButton
          key={tab.key}
          label={tab.label}
          count={tab.count}
          isSelected={activeTab === tab.key}
          onSelect={() => onSelectTab(tab.key)}
        />
      ))}
    </View>
  );
}
