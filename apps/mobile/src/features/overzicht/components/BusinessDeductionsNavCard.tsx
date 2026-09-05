import { Pressable, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Card, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'freelance.deductions_card_title',
  subtitle: 'freelance.deductions_card_desc',
  mileageTitle: 'freelance.mileage_title',
  mileageDesc: 'freelance.mileage_nav_desc',
  assetsTitle: 'freelance.assets_title',
  assetsDesc: 'freelance.assets_nav_desc',
} as const;

interface NavRowProps {
  readonly icon: string;
  readonly title: string;
  readonly desc: string;
  readonly route: string;
}

function DeductionsNavRow({ icon, title, desc, route }: NavRowProps) {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(route as Href<string>)}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing['12'],
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.bgSubtle,
      }}
    >
      <View style={{ gap: theme.spacing['2'] }}>
        <Text variant="body" style={{ fontWeight: '600' }}>
          {icon} {title}
        </Text>
        <Text variant="label" color="secondary">
          {desc}
        </Text>
      </View>
      <Text variant="label" color="accent" style={{ fontWeight: '600' }}>
        →
      </Text>
    </Pressable>
  );
}

/* ── Implementation ───────────────────────────────────── */
export function BusinessDeductionsNavCard() {
  const t = useT();
  const { theme } = useTheme();

  return (
    <Card padded style={{ gap: theme.spacing['16'], borderRadius: theme.radius.xl }}>
      <View style={{ gap: theme.spacing['4'] }}>
        <Text variant="title">{t(TEXT.title)}</Text>
        <Text variant="label" color="secondary">
          {t(TEXT.subtitle)}
        </Text>
      </View>

      <View style={{ gap: theme.spacing['8'] }}>
        <DeductionsNavRow
          icon="🚗"
          title={t(TEXT.mileageTitle)}
          desc={t(TEXT.mileageDesc)}
          route="/zakelijk/ritten"
        />
        <DeductionsNavRow
          icon="💻"
          title={t(TEXT.assetsTitle)}
          desc={t(TEXT.assetsDesc)}
          route="/zakelijk/afschrijvingen"
        />
      </View>
    </Card>
  );
}
