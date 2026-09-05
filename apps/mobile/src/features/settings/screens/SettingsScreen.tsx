import { Pressable, ScrollView, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { BottomBackButton, Button, Card, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { useBudgetStore } from '@/features/budget';
import { useAuth } from '@/providers/AuthProvider';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'instellingen.title',
  subtitle: 'instellingen.subtitle',
  sectionAccount: 'instellingen.section_account',
  profile: 'instellingen.profile',
  household: 'instellingen.household',
  businessTax: 'instellingen.business_tax',
  sectionPreferences: 'instellingen.section_preferences',
  notifications: 'instellingen.notifications',
  security: 'instellingen.security',
  subscription: 'instellingen.subscription',
  sectionAbout: 'instellingen.section_about',
  about: 'instellingen.about',
  privacy: 'instellingen.privacy',
  signOut: 'instellingen.sign_out',
  offlineBadge: 'instellingen.offline_badge',
  version: 'instellingen.version',
} as const;

/* ── Sub-components ───────────────────────────────────── */

interface SettingsRowItem {
  readonly title: string;
  readonly href: string;
  readonly isLast?: boolean | undefined;
}

function SettingsRow({ item, onNavigate }: { readonly item: SettingsRowItem; readonly onNavigate: (href: string) => void }) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={() => onNavigate(item.href)}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing['12'],
        borderBottomWidth: item.isLast ? 0 : 1,
        borderBottomColor: theme.colors.borderSubtle,
        minHeight: 44,
      }}
    >
      <Text variant="body" style={{ fontWeight: '500' }}>
        {item.title}
      </Text>
      <Text variant="body" color="accent" style={{ fontWeight: '600' }}>
        →
      </Text>
    </Pressable>
  );
}

function ProfileHeaderCard({ email, isDevBypass }: { readonly email: string; readonly isDevBypass: boolean }) {
  const t = useT();
  const { theme } = useTheme();
  const accounts = useBudgetStore((s) => s.accounts);
  const initial = email.charAt(0).toUpperCase() || 'K';

  return (
    <Card padded style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing['16'], borderRadius: theme.radius.xl }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.accentBg,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text variant="title" color="inverse">
          {initial}
        </Text>
      </View>
      <View style={{ flex: 1, gap: theme.spacing['4'] }}>
        <Text variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>
          {email}
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing['8'], alignItems: 'center' }}>
          <View
            style={{
              paddingHorizontal: theme.spacing['8'],
              paddingVertical: 2,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.bgSubtle,
            }}
          >
            <Text variant="label" color="accent" style={{ fontSize: 11, fontWeight: '600' }}>
              {isDevBypass ? t(TEXT.offlineBadge) : `${accounts.length} rekeningen`}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

function SettingsSection({
  title,
  rows,
  onNavigate,
}: {
  readonly title: string;
  readonly rows: readonly { readonly title: string; readonly href: string }[];
  readonly onNavigate: (href: string) => void;
}) {
  const { theme } = useTheme();

  return (
    <View style={{ gap: theme.spacing['8'] }}>
      <Text variant="label" color="secondary" style={{ paddingHorizontal: theme.spacing['4'], fontWeight: '600' }}>
        {title.toUpperCase()}
      </Text>
      <Card padded style={{ borderRadius: theme.radius.xl }}>
        {rows.map((row, idx) => (
          <SettingsRow
            key={row.href}
            item={{ ...row, isLast: idx === rows.length - 1 }}
            onNavigate={onNavigate}
          />
        ))}
      </Card>
    </View>
  );
}

/* ── Component ────────────────────────────────────────── */

export function SettingsScreen() {
  const t = useT();
  const router = useRouter();
  const { theme } = useTheme();
  const { isDevBypass, signOut } = useAuth();

  const handleNavigate = (href: string) => router.push(href as Href<string>);

  const accountRows = [
    { title: t(TEXT.household), href: '/instellingen/huishouden' },
    { title: t(TEXT.businessTax), href: '/zakelijk/btw-aangifte' },
    { title: t(TEXT.profile), href: '/instellingen/profiel' },
  ];

  const prefRows = [
    { title: t(TEXT.notifications), href: '/instellingen/meldingen' },
    { title: t(TEXT.security), href: '/instellingen/beveiliging' },
    { title: t(TEXT.subscription), href: '/instellingen/abonnement' },
  ];

  const aboutRows = [
    { title: t(TEXT.privacy), href: '/instellingen/privacy' },
    { title: t(TEXT.about), href: '/instellingen/over' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }}>
      <ScrollView
        testID="instellingen-screen"
        contentContainerStyle={{
          padding: theme.spacing['20'],
          gap: theme.spacing['16'],
          paddingBottom: 90,
        }}
      >
        <View style={{ gap: theme.spacing['4'] }}>
          <Text variant="title-lg">{t(TEXT.title)}</Text>
          <Text variant="body" color="secondary">{t(TEXT.subtitle)}</Text>
        </View>

        <ProfileHeaderCard email="dev@kwartje.app" isDevBypass={isDevBypass} />

        <SettingsSection title={t(TEXT.sectionAccount)} rows={accountRows} onNavigate={handleNavigate} />
        <SettingsSection title={t(TEXT.sectionPreferences)} rows={prefRows} onNavigate={handleNavigate} />
        <SettingsSection title={t(TEXT.sectionAbout)} rows={aboutRows} onNavigate={handleNavigate} />

        <Button variant="danger" label={t(TEXT.signOut)} onPress={signOut} />

        <View style={{ alignItems: 'center', paddingVertical: theme.spacing['8'] }}>
          <Text variant="label" color="secondary" style={{ fontSize: 12 }}>
            {t(TEXT.version)}
          </Text>
        </View>
      </ScrollView>
      <BottomBackButton />
    </View>
  );
}
