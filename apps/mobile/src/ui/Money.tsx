// The only way to render an amount of money (`docs/12` §5, `.claude/rules/06`). Always
// tabular-figures, always formatted by `formatEUR`, always exposes a speech-friendly
// `accessibilityLabel` via `formatMoneyForSpeech` so VoiceOver/TalkBack read "412 euro", not
// "euro four hundred twelve" (`docs/15` §5).
import { formatEUR, formatMoneyForSpeech, type Cents } from '@shared';
import { Text, type TextColorToken } from './Text';
import type { TypeVariant } from './tokens';

/* ── Types ────────────────────────────────────────────── */

export type MoneySign = 'auto' | 'always' | 'none';

export interface MoneyProps {
  readonly cents: Cents;
  readonly variant?: TypeVariant;
  /**
   * `'auto'` shows `−` only for a negative amount (the default everywhere).
   * `'always'` also prefixes a positive amount with `+` (income rows, deltas).
   * `'none'` never shows a sign, rendering the absolute value (target amounts, magnitudes).
   */
  readonly sign?: MoneySign;
  /** Show whole euros without `,00` where the amount happens to be a whole euro. */
  readonly compact?: boolean;
  /** Overrides the built-in direction colouring (positive = green, zero/negative = neutral). */
  readonly color?: TextColorToken;
  readonly testID?: string | undefined;
  /** Overrides the computed `formatMoneyForSpeech` label — rarely needed. */
  readonly accessibilityLabel?: string | undefined;
}

/* ── Implementation ───────────────────────────────────── */

const DEFAULT_SIGN: MoneySign = 'auto';
const PLUS_PREFIX = '+';

interface MoneyDisplay {
  readonly text: string;
  readonly color: TextColorToken;
}

/** Pure: turns an amount plus its presentation options into the string and colour to render. */
export function moneyDisplay(
  amount: Cents,
  options: { readonly sign: MoneySign; readonly compact: boolean; readonly color?: TextColorToken },
): MoneyDisplay {
  const displayCents = options.sign === 'none' ? (Math.abs(amount) as Cents) : amount;
  const formatted = formatEUR(displayCents, { decimals: options.compact ? 'auto' : 'always' });
  const text = options.sign === 'always' && amount > 0 ? `${PLUS_PREFIX}${formatted}` : formatted;
  return { text, color: options.color ?? (amount > 0 ? 'positive' : 'primary') };
}

export function Money({ cents, variant = 'body', sign = DEFAULT_SIGN, compact = false, color, testID, accessibilityLabel }: MoneyProps) {
  const { text: withSign, color: resolvedColor } = moneyDisplay(cents, { sign, compact, ...(color ? { color } : {}) });

  return (
    <Text
      variant={variant}
      color={resolvedColor}
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? formatMoneyForSpeech(cents)}
      style={{ fontVariant: ['tabular-nums'] }}
    >
      {withSign}
    </Text>
  );
}
