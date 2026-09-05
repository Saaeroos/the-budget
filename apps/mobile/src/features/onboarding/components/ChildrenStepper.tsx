import { View } from 'react-native';
import { Button, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  childrenCount: 'onboarding.huishouden.children_count',
} as const;

const TEST_ID = {
  childrenMinus: 'household-children-minus',
  childrenPlus: 'household-children-plus',
} as const;

/* ── Types ────────────────────────────────────────────── */

export interface ChildrenStepperProps {
  readonly count: number;
  readonly onChange: (val: number) => void;
}

/* ── Component ────────────────────────────────────────── */

export function ChildrenStepper({ count, onChange }: ChildrenStepperProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing['12'],
        paddingTop: theme.spacing['12'],
        borderTopWidth: 1,
        borderColor: theme.colors.borderSubtle,
      }}
    >
      <Text variant="body">{t(TEXT.childrenCount, { count: Math.max(count, 1) })}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing['8'] }}>
        <Button
          variant="secondary"
          size="md"
          label="-"
          testID={TEST_ID.childrenMinus}
          disabled={count <= 1}
          onPress={() => onChange(Math.max(1, count - 1))}
        />
        <Button
          variant="secondary"
          size="md"
          label="+"
          testID={TEST_ID.childrenPlus}
          onPress={() => onChange(count + 1)}
        />
      </View>
    </View>
  );
}
