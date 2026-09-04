// `docs/12` §5: period/type switches. Exposed as a tablist so VoiceOver/TalkBack announce
// position-in-set ("1 of 3") the way a native segmented control does.
import { Pressable, View } from 'react-native';
import { Text } from './Text';
import { useTheme } from './ThemeProvider';

/* ── Types ────────────────────────────────────────────── */

export interface SegmentedControlOption<Value extends string> {
  readonly value: Value;
  readonly label: string;
  readonly testID: string;
}

export interface SegmentedControlProps<Value extends string> {
  readonly options: readonly SegmentedControlOption<Value>[];
  readonly value: Value;
  readonly onChange: (value: Value) => void;
  readonly testID: string;
  readonly accessibilityLabel?: string;
}

/* ── Implementation ───────────────────────────────────── */

const MIN_TOUCH_HEIGHT = 44;

export function SegmentedControl<Value extends string>({
  options,
  value,
  onChange,
  testID,
  accessibilityLabel,
}: SegmentedControlProps<Value>) {
  const { theme } = useTheme();

  return (
    <View
      testID={testID}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.bgSubtle,
        borderRadius: theme.radius.md,
        padding: theme.spacing['4'],
        gap: theme.spacing['4'],
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            testID={option.testID}
            style={{
              flex: 1,
              minHeight: MIN_TOUCH_HEIGHT,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.radius.sm,
              backgroundColor: selected ? theme.colors.bgSurface : 'transparent',
            }}
          >
            <Text variant="label" color={selected ? 'primary' : 'secondary'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
