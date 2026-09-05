import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { BucketKind } from '@/features/budget';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  searchPlaceholder: 'transactions.search_placeholder',
  filterAll: 'transactions.filter_all',
  filterFixed: 'transactions.filter_fixed',
  filterHousehold: 'transactions.filter_household',
  filterDiscretionary: 'transactions.filter_discretionary',
  filterIncome: 'transactions.filter_income',
  filterBusiness: 'transactions.filter_business',
  filterPersonal: 'transactions.filter_personal',
} as const;

/* ── Types ────────────────────────────────────────────── */

export type FilterBucket = 'all' | 'business' | 'personal' | BucketKind;

interface TransactionFiltersProps {
  readonly query: string;
  readonly onQueryChange: (val: string) => void;
  readonly selectedBucket: FilterBucket;
  readonly onSelectBucket: (bucket: FilterBucket) => void;
}

interface FilterOption {
  readonly key: FilterBucket;
  readonly labelKey: string;
}

const FILTER_OPTIONS: readonly FilterOption[] = [
  { key: 'all', labelKey: TEXT.filterAll },
  { key: 'business', labelKey: TEXT.filterBusiness },
  { key: 'personal', labelKey: TEXT.filterPersonal },
  { key: 'vaste_lasten', labelKey: TEXT.filterFixed },
  { key: 'huishoudelijk', labelKey: TEXT.filterHousehold },
  { key: 'vrij_besteedbaar', labelKey: TEXT.filterDiscretionary },
  { key: 'inkomen', labelKey: TEXT.filterIncome },
];

interface FilterPillProps {
  readonly option: FilterOption;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
}

function FilterPill({ option, isSelected, onSelect }: FilterPillProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onSelect}
      style={{
        paddingHorizontal: theme.spacing['12'],
        paddingVertical: theme.spacing['8'],
        borderRadius: theme.radius.full,
        backgroundColor: isSelected ? theme.colors.accentBg : theme.colors.bgSubtle,
        borderWidth: 1,
        borderColor: isSelected ? theme.colors.accentBg : theme.colors.borderSubtle,
      }}
    >
      <Text variant="label" color={isSelected ? 'inverse' : 'secondary'}>
        {t(option.labelKey)}
      </Text>
    </Pressable>
  );
}

/* ── Component ────────────────────────────────────────── */

export function TransactionFilters({
  query,
  onQueryChange,
  selectedBucket,
  onSelectBucket,
}: TransactionFiltersProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View style={{ gap: theme.spacing['12'] }}>
      <TextInput
        placeholder={t(TEXT.searchPlaceholder)}
        placeholderTextColor={theme.colors.textTertiary}
        value={query}
        onChangeText={onQueryChange}
        style={{
          height: 44,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.bgSubtle,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          paddingHorizontal: theme.spacing['16'],
          color: theme.colors.textPrimary,
          fontSize: 15,
        }}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.spacing['8'] }}
      >
        {FILTER_OPTIONS.map((opt) => (
          <FilterPill
            key={opt.key}
            option={opt}
            isSelected={selectedBucket === opt.key}
            onSelect={() => onSelectBucket(opt.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
