// The only way to render text in this app (`docs/12` §5, `.claude/rules/06`). Wraps RN's
// `Text`, resolves the type scale and colour tokens from `useTheme()`, and caps dynamic-type
// scaling on `display-xl` per `docs/12` §3.
import { Text as RNText, type StyleProp, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from './ThemeProvider';
import type { TypeVariant } from './tokens';

/* ── Types ────────────────────────────────────────────── */

export type TextColorToken =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'accent'
  | 'warn'
  | 'danger'
  | 'info'
  | 'positive';

export interface TextProps extends Omit<RNTextProps, 'style'> {
  readonly variant?: TypeVariant;
  readonly color?: TextColorToken;
  readonly children: RNTextProps['children'];
  readonly testID?: string | undefined;
  /**
   * Escape hatch for the rare case a caller needs to merge a non-token style fragment onto the
   * resolved type-scale style (e.g. `<Money>` forcing `fontVariant: ['tabular-nums']` on a
   * variant that doesn't already carry it). Never a colour, spacing, radius or font size —
   * those still come only from `tokens.ts` via `variant`/`color`.
   */
  readonly style?: StyleProp<TextStyle>;
}

/* ── Implementation ───────────────────────────────────── */

const DEFAULT_VARIANT: TypeVariant = 'body';
const DEFAULT_COLOR: TextColorToken = 'primary';

export function Text({ variant = DEFAULT_VARIANT, color = DEFAULT_COLOR, style, ...rest }: TextProps) {
  const { theme } = useTheme();
  const token = theme.type[variant];
  const colorValue = resolveColor(theme, color);
  const maxFontSizeMultiplier = theme.typeScaleCap[variant];

  return (
    <RNText
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        {
          fontSize: token.fontSize,
          lineHeight: token.lineHeight,
          fontWeight: token.fontWeight,
          fontFamily: token.fontFamily,
          fontVariant: token.fontVariant,
          color: colorValue,
        },
        style,
      ]}
    />
  );
}

function resolveColor(theme: ReturnType<typeof useTheme>['theme'], color: TextColorToken): string {
  switch (color) {
    case 'primary':
      return theme.colors.textPrimary;
    case 'secondary':
      return theme.colors.textSecondary;
    case 'tertiary':
      return theme.colors.textTertiary;
    case 'inverse':
      return theme.colors.textInverse;
    case 'accent':
      return theme.colors.accentBg;
    case 'warn':
      return theme.colors.statusWarn;
    case 'danger':
      return theme.colors.statusDanger;
    case 'info':
      return theme.colors.statusInfo;
    case 'positive':
      return theme.colors.statusPositive;
    default:
      return theme.colors.textPrimary;
  }
}
