import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { NavSettingsSvg, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { ScopeHeaderPill } from '@/features/budget';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'today.title',
} as const;

const TEST_ID = {
  header: 'today-header',
  settingsButton: 'today-settings-button',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface TodayHeaderProps {
  readonly periodLabel: string;
}

/* ── Component ────────────────────────────────────────── */

export function TodayHeader({ periodLabel }: TodayHeaderProps) {
  const t = useT();
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View testID={TEST_ID.header} style={{ gap: theme.spacing['12'], paddingVertical: theme.spacing['8'] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ScopeHeaderPill />
        <Pressable
          testID={TEST_ID.settingsButton}
          onPress={() => router.push('/instellingen/')}
          accessibilityRole="button"
          accessibilityLabel={t(TEXT.title)}
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.bgSurface,
            borderWidth: 1,
            borderColor: theme.colors.borderSubtle,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <NavSettingsSvg size={20} color={theme.colors.textSecondary} />
        </Pressable>
      </View>
      <View style={{ gap: theme.spacing['2'] }}>
        <Text variant="title-lg">{t(TEXT.title)}</Text>
        <Text variant="label" color="secondary">
          {periodLabel}
        </Text>
      </View>
    </View>
  );
}
