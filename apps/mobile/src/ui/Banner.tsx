// Persistent inline status: offline, stale bank data, expiring consent (`docs/11` §State matrix,
// `docs/08` §8). Meaning is never carried by colour alone — every tone also ships an icon.
import { StyleSheet, View } from 'react-native';
import { AlertTriangle, Info, OctagonAlert, X } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { Text } from './Text';
import { useTheme } from './ThemeProvider';
import type { Theme } from './tokens';

/* ── Types ────────────────────────────────────────────── */

export type BannerTone = 'info' | 'warn' | 'danger';

export interface BannerAction {
  readonly label: string;
  readonly onPress: () => void;
}

export interface BannerProps {
  readonly tone: BannerTone;
  /** Already-translated message. */
  readonly message: string;
  readonly action?: BannerAction;
  /** Localised label for the dismiss control; omitting it hides the control. */
  readonly dismissLabel?: string;
  readonly onDismiss?: () => void;
  readonly testID?: string;
}

/* ── Implementation ───────────────────────────────────── */

const TONE_ICON = { info: Info, warn: AlertTriangle, danger: OctagonAlert } as const;
const HIT_SLOP = 12;

function toneColors(theme: Theme, tone: BannerTone) {
  const fg = {
    info: theme.colors.statusInfo,
    warn: theme.colors.statusWarn,
    danger: theme.colors.statusDanger,
  }[tone];
  return { fg, border: fg, background: theme.colors.bgSurface };
}

export function Banner({ tone, message, action, dismissLabel, onDismiss, testID }: BannerProps) {
  const { theme } = useTheme();
  const { fg, border, background } = toneColors(theme, tone);
  const Icon = TONE_ICON[tone];

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="alert"
      style={[
        styles.root,
        { backgroundColor: background, borderColor: border, borderRadius: theme.radius.md },
      ]}
    >
      <Icon size={theme.icon.sizeInline} strokeWidth={theme.icon.strokeWidth} color={fg} />
      <View style={styles.body}>
        <Text variant="body">{message}</Text>
        {action ? (
          <Pressable onPress={action.onPress} hitSlop={HIT_SLOP} accessibilityRole="button">
            <Text variant="label" color="accent">
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {dismissLabel && onDismiss ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel={dismissLabel}
        >
          <X size={theme.icon.sizeInline} strokeWidth={theme.icon.strokeWidth} color={theme.colors.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'flex-start', borderWidth: 1, flexDirection: 'row', gap: 12, padding: 12 },
  body: { flex: 1, gap: 4 },
});
