import { Modal, Pressable, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cents, type Cents } from '@shared';
import { Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { useBudgetStore, type ActiveScope, type LocalAccount } from '../store/useBudgetStore';

/* ── Types ────────────────────────────────────────────── */

export interface ScopeSelectorSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly testID?: string;
}

interface ScopeOption {
  readonly key: ActiveScope;
  readonly labelKey: 'scope.all' | 'scope.personal' | 'scope.household' | 'scope.business';
  readonly balanceCents: Cents;
}

/* ── Helpers ──────────────────────────────────────────── */

function calculateScopeBalances(accounts: readonly LocalAccount[]) {
  let all = 0;
  let personal = 0;
  let household = 0;
  let business = 0;

  for (const acc of accounts) {
    all += acc.balanceCents;
    if (acc.scope === 'business') {
      business += acc.balanceCents;
    } else if (acc.scope === 'household' || acc.type === 'joint') {
      household += acc.balanceCents;
    } else {
      personal += acc.balanceCents;
    }
  }

  return {
    all: cents(all),
    personal: cents(personal),
    household: cents(household),
    business: cents(business),
  };
}

function buildScopeOptions(balances: ReturnType<typeof calculateScopeBalances>): readonly ScopeOption[] {
  return [
    { key: 'all', labelKey: 'scope.all', balanceCents: balances.all },
    { key: 'personal', labelKey: 'scope.personal', balanceCents: balances.personal },
    { key: 'household', labelKey: 'scope.household', balanceCents: balances.household },
    { key: 'business', labelKey: 'scope.business', balanceCents: balances.business },
  ];
}

/* ── Option Row ───────────────────────────────────────── */

function ScopeOptionRow({
  option,
  isSelected,
  onSelect,
}: {
  readonly option: ScopeOption;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
}) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <Pressable
      testID={`scope-option-${option.key}`}
      accessibilityRole="button"
      onPress={onSelect}
      style={({ pressed }) => [
        styles.optionRow,
        {
          backgroundColor: isSelected ? theme.colors.bgSubtle : theme.colors.bgSurface,
          borderColor: isSelected ? theme.colors.accentBg : theme.colors.borderSubtle,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.optionLeft}>
        <View
          style={[
            styles.radioCircle,
            {
              borderColor: isSelected ? theme.colors.accentBg : theme.colors.borderStrong,
              backgroundColor: isSelected ? theme.colors.accentBg : 'transparent',
            },
          ]}
        >
          {isSelected ? <View style={styles.radioDot} /> : null}
        </View>
        <Text variant="body" style={{ fontWeight: isSelected ? '700' : '500' }}>
          {t(option.labelKey)}
        </Text>
      </View>
      <Money cents={option.balanceCents} variant="body" color={isSelected ? 'accent' : 'primary'} />
    </Pressable>
  );
}

/* ── Implementation ───────────────────────────────────── */

function ScopeSheetContent({
  options,
  activeScope,
  onSelect,
  testID,
}: {
  readonly options: readonly ScopeOption[];
  readonly activeScope: ActiveScope;
  readonly onSelect: (scope: ActiveScope) => void;
  readonly testID?: string;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <TouchableWithoutFeedback>
      <View
        testID={testID}
        style={[
          styles.sheet,
          {
            backgroundColor: theme.colors.bgSurfaceRaised,
            paddingBottom: Math.max(insets.bottom, theme.spacing['20']) + theme.spacing['8'],
          },
        ]}
      >
        <View style={[styles.dragHandle, { backgroundColor: theme.colors.borderStrong }]} />
        <View style={{ gap: theme.spacing['4'], marginBottom: theme.spacing['16'] }}>
          <Text variant="title">{t('scope.title')}</Text>
          <Text variant="label" color="secondary">
            {t('scope.subtitle')}
          </Text>
        </View>

        <View style={{ gap: theme.spacing['8'] }}>
          {options.map((opt) => (
            <ScopeOptionRow
              key={opt.key}
              option={opt}
              isSelected={activeScope === opt.key}
              onSelect={() => onSelect(opt.key)}
            />
          ))}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

/* ── Implementation ───────────────────────────────────── */

export function ScopeSelectorSheet({
  visible,
  onClose,
  testID = 'scope-selector-sheet',
}: ScopeSelectorSheetProps) {
  const activeScope = useBudgetStore((s) => s.activeScope);
  const setActiveScope = useBudgetStore((s) => s.setActiveScope);
  const accounts = useBudgetStore((s) => s.accounts);

  const balances = calculateScopeBalances(accounts);
  const options = buildScopeOptions(balances);

  const handleSelect = (scope: ActiveScope) => {
    setActiveScope(scope);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <ScopeSheetContent
            options={options}
            activeScope={activeScope}
            onSelect={handleSelect}
            testID={testID}
          />
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});
