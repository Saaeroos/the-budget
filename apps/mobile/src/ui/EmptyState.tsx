// Required on every list (`docs/11` §State matrix). Teaches what belongs here and offers one
// action — it never merely decorates.
import { StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Button } from './Button';
import { Text } from './Text';
import { useTheme } from './ThemeProvider';

/* ── Types ────────────────────────────────────────────── */

export interface EmptyStateAction {
  readonly label: string;
  readonly onPress: () => void;
  readonly testID?: string;
}

export interface EmptyStateProps {
  /** Already-translated title. `ui/` never resolves i18n keys itself. */
  readonly title: string;
  readonly body: string;
  readonly icon?: LucideIcon;
  readonly action?: EmptyStateAction;
  readonly testID?: string;
}

/* ── Implementation ───────────────────────────────────── */

const ICON_SIZE = 40;

export function EmptyState({ title, body, icon: Icon, action, testID }: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.root} testID={testID} accessibilityRole="summary">
      {Icon ? (
        <View
          style={[
            styles.iconWell,
            { backgroundColor: theme.colors.bgSubtle, borderRadius: theme.radius.full },
          ]}
        >
          <Icon size={ICON_SIZE} strokeWidth={theme.icon.strokeWidth} color={theme.colors.textTertiary} />
        </View>
      ) : null}
      <Text variant="title" style={styles.centered}>
        {title}
      </Text>
      <Text variant="body" color="secondary" style={styles.centered}>
        {body}
      </Text>
      {action ? (
        <View style={styles.action}>
          <Button label={action.label} onPress={action.onPress} testID={action.testID} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 40 },
  iconWell: { alignItems: 'center', height: 72, justifyContent: 'center', marginBottom: 4, width: 72 },
  centered: { textAlign: 'center' },
  action: { marginTop: 8 },
});
