// `docs/12` §5: numeric pad, `,` decimal, max 2 decimals, live € formatting, never allows a
// leading `-` — there simply is no minus key on the pad, so a negative amount cannot be typed.
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { cents as toCents, formatMoneyForSpeech, type Cents } from '@shared';
import { Delete } from 'lucide-react-native';
import { Money } from './Money';
import { Text } from './Text';
import { useTheme } from './ThemeProvider';

/* ── Types ────────────────────────────────────────────── */

export interface AmountInputProps {
  readonly initialCents?: Cents;
  readonly onChangeCents: (cents: Cents) => void;
  readonly backspaceAccessibilityLabel: string;
  readonly testID: string;
}

type KeyValue = `${number}` | ',' | 'backspace';

interface KeypadKey {
  readonly value: KeyValue;
  readonly testID: string;
}

/* ── Implementation ───────────────────────────────────── */

// Digits and the decimal separator are locale-invariant symbols on the key face itself, not
// translatable copy — the same convention as `packages/shared`'s formatter `SYMBOLS` consts.
const KEYPAD: readonly KeypadKey[] = [
  { value: '1', testID: 'amount-input-key-1' },
  { value: '2', testID: 'amount-input-key-2' },
  { value: '3', testID: 'amount-input-key-3' },
  { value: '4', testID: 'amount-input-key-4' },
  { value: '5', testID: 'amount-input-key-5' },
  { value: '6', testID: 'amount-input-key-6' },
  { value: '7', testID: 'amount-input-key-7' },
  { value: '8', testID: 'amount-input-key-8' },
  { value: '9', testID: 'amount-input-key-9' },
  { value: ',', testID: 'amount-input-key-comma' },
  { value: '0', testID: 'amount-input-key-0' },
  { value: 'backspace', testID: 'amount-input-key-backspace' },
];

const LIMITS = { maxIntegerDigits: 7, maxFractionDigits: 2, keySize: 64 } as const;

function bufferFromCents(value: Cents): string {
  const euros = Math.floor(value / 100);
  const remainder = value % 100;
  return remainder === 0 ? `${euros}` : `${euros},${String(remainder).padStart(2, '0')}`;
}

function centsFromBuffer(buffer: string): Cents {
  const [intPart, fracPart = ''] = buffer.split(',');
  const euros = Number(intPart || '0');
  const fraction = fracPart.padEnd(LIMITS.maxFractionDigits, '0').slice(0, LIMITS.maxFractionDigits);
  return toCents(euros * 100 + Number(fraction || '0'));
}

function applyKey(buffer: string, key: KeyValue): string {
  if (key === 'backspace') return buffer.slice(0, -1);
  if (key === ',') return buffer.includes(',') ? buffer : `${buffer || '0'},`;
  const [intPart = '', fracPart] = buffer.split(',');
  if (fracPart !== undefined) {
    return fracPart.length >= LIMITS.maxFractionDigits ? buffer : `${buffer}${key}`;
  }
  const nextInt = `${intPart}${key}`.replace(/^0+(?=\d)/, '');
  return nextInt.length > LIMITS.maxIntegerDigits ? buffer : nextInt;
}

export function AmountInput({ initialCents, onChangeCents, backspaceAccessibilityLabel, testID }: AmountInputProps) {
  const { theme } = useTheme();
  const [buffer, setBuffer] = useState(() => bufferFromCents(initialCents ?? toCents(0)));
  const cents = useMemo(() => centsFromBuffer(buffer), [buffer]);

  const handleKey = (key: KeyValue) => {
    const next = applyKey(buffer, key);
    setBuffer(next);
    onChangeCents(centsFromBuffer(next));
  };

  return (
    <View testID={testID} style={{ gap: theme.spacing['24'] }}>
      <Money cents={cents} variant="display-xl" sign="none" accessibilityLabel={formatMoneyForSpeech(cents)} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['12'], justifyContent: 'center' }}>
        {KEYPAD.map((key) => (
          <Pressable
            key={key.value}
            onPress={() => handleKey(key.value)}
            accessibilityRole="button"
            accessibilityLabel={key.value === 'backspace' ? backspaceAccessibilityLabel : key.value}
            testID={key.testID}
            style={{
              width: LIMITS.keySize,
              height: LIMITS.keySize,
              borderRadius: theme.radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.bgSubtle,
            }}
          >
            {key.value === 'backspace' ? (
              <Delete size={theme.icon.sizeInline} strokeWidth={theme.icon.strokeWidth} color={theme.colors.textPrimary} />
            ) : (
              <Text variant="title-lg">{key.value}</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
