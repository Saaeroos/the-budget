import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { useActiveScope, type ActiveScope } from '../store/useBudgetStore';
import { ScopeSelectorSheet } from './ScopeSelectorSheet';

/* ── Types ────────────────────────────────────────────── */

export interface ScopeHeaderPillProps {
  readonly prefix?: string;
  readonly testID?: string;
}

/* ── Helpers ──────────────────────────────────────────── */

function getScopeLabelKey(scope: ActiveScope): 'scope.all' | 'scope.personal' | 'scope.household' | 'scope.business' {
  switch (scope) {
    case 'all':
      return 'scope.all';
    case 'personal':
      return 'scope.personal';
    case 'household':
      return 'scope.household';
    case 'business':
      return 'scope.business';
  }
}

/* ── Component ────────────────────────────────────────── */

export function ScopeHeaderPill({ prefix, testID = 'scope-header-pill' }: ScopeHeaderPillProps) {
  const t = useT();
  const { theme } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeScope = useActiveScope();

  const label = t(getScopeLabelKey(activeScope));
  const fullLabel = prefix ? `${prefix}: ${label}` : label;

  return (
    <>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={fullLabel}
        onPress={() => setSheetOpen(true)}
        style={({ pressed }) => [
          styles.pill,
          {
            backgroundColor: theme.colors.bgSubtle,
            borderColor: theme.colors.borderSubtle,
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        <View style={styles.dot} />
        <Text variant="label" style={styles.labelText}>
          {fullLabel}
        </Text>
        <Text variant="label" color="accent" style={styles.chevron}>
          ▾
        </Text>
      </Pressable>

      <ScopeSelectorSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2D7A66',
  },
  labelText: {
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  chevron: {
    fontSize: 10,
    fontWeight: '700',
  },
});
