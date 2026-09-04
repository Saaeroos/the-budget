// `docs/12` §5: variants `primary | secondary | ghost | danger`, sizes `md | lg`, loading
// state, full-width option. Buttons are the one place copy is a plain prop, not a `TEXT`
// lookup — `ui/` never calls `useTranslation()`; the caller resolves the label and passes it
// in already translated (`.claude/rules/06-ui-and-styling.md`).
import { ActivityIndicator, Pressable, View, type GestureResponderEvent, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { useTheme } from './ThemeProvider';
import type { Theme } from './tokens';

/* ── Types ────────────────────────────────────────────── */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps {
  readonly label: string;
  readonly onPress: (event: GestureResponderEvent) => void;
  /** Defaults to `label` — pass this only when the visible text isn't a good spoken name. */
  readonly accessibilityLabel?: string | undefined;
  readonly testID?: string | undefined;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
}

interface VariantColors {
  readonly background: string;
  readonly foreground: string;
  readonly borderColor?: string;
}

/* ── Implementation ───────────────────────────────────── */

const SIZE_HEIGHT = { md: 44, lg: 56 } as const;

function variantColors(theme: Theme, variant: ButtonVariant, disabled: boolean): VariantColors {
  if (disabled) {
    return { background: theme.colors.bgSubtle, foreground: theme.colors.textTertiary };
  }
  switch (variant) {
    case 'primary':
      return { background: theme.colors.accentBg, foreground: theme.colors.accentFg };
    case 'secondary':
      return { background: theme.colors.bgSubtle, foreground: theme.colors.textPrimary, borderColor: theme.colors.borderStrong };
    case 'ghost':
      return { background: 'transparent', foreground: theme.colors.accentBg };
    case 'danger':
      return { background: theme.colors.statusDanger, foreground: theme.colors.textInverse };
    default:
      return { background: theme.colors.accentBg, foreground: theme.colors.accentFg };
  }
}

const PRESSED_OPACITY = 0.85;

interface SurfaceStyleInput {
  readonly theme: Theme;
  readonly colors: VariantColors;
  readonly height: number;
  readonly fullWidth: boolean;
  readonly pressed: boolean;
}

function surfaceStyle({ theme, colors, height, fullWidth, pressed }: SurfaceStyleInput): ViewStyle {
  return {
    minHeight: height,
    minWidth: height,
    paddingHorizontal: theme.spacing['20'],
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderWidth: colors.borderColor ? 1 : 0,
    borderColor: colors.borderColor,
    opacity: pressed ? PRESSED_OPACITY : 1,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
  };
}

export function Button({
  label,
  onPress,
  accessibilityLabel,
  testID,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;
  const colors = variantColors(theme, variant, isDisabled);
  const height = SIZE_HEIGHT[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      style={({ pressed }) => surfaceStyle({ theme, colors, height, fullWidth, pressed })}
    >
      {loading ? (
        <View style={{ marginEnd: theme.spacing['8'] }}>
          <ActivityIndicator color={colors.foreground} />
        </View>
      ) : null}
      <Text variant="body" style={{ color: colors.foreground, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}
