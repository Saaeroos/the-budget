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

export function Money({ cents, variant = 'body', sign = DEFAULT_SIGN, compact = false, color, testID, accessibilityLabel }: MoneyProps) {
  const displayCents = sign === 'none' ? (Math.abs(cents) as Cents) : cents;
  const formatted = formatEUR(displayCents, { decimals: compact ? 'auto' : 'always' });
  const withSign = sign === 'always' && cents > 0 ? `${PLUS_PREFIX}${formatted}` : formatted;
  const resolvedColor: TextColorToken = color ?? (cents > 0 ? 'positive' : 'primary');

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
