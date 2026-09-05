import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, KwartjeMarkSvg, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  welcomeTitle: 'auth.welcome_title',
  card1Title: 'auth.welcome_card_1_title',
  card1Desc: 'auth.welcome_card_1_desc',
  card2Title: 'auth.welcome_card_2_title',
  card2Desc: 'auth.welcome_card_2_desc',
  card3Title: 'auth.welcome_card_3_title',
  card3Desc: 'auth.welcome_card_3_desc',
  startOnboarding: 'auth.start_onboarding',
  haveAccount: 'auth.have_account',
  readOnly: 'banks.readonly',
} as const;

const TEST_ID = {
  screen: 'welkom-screen',
  startButton: 'welcome-start-button',
  loginButton: 'welcome-login-button',
} as const;

/* ── Sub-components ───────────────────────────────────── */

interface ValuePointProps {
  readonly title: string;
  readonly desc: string;
}

function ValuePoint({ title, desc }: ValuePointProps) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['12'], paddingHorizontal: theme.spacing['8'] }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.accentBg,
          marginTop: 7,
        }}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="title">{title}</Text>
        <Text variant="body" color="secondary">
          {desc}
        </Text>
      </View>
    </View>
  );
}

function WelcomeValueList() {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View style={{ width: '100%', gap: theme.spacing['16'], marginVertical: theme.spacing['12'] }}>
      <ValuePoint title={t(TEXT.card1Title)} desc={t(TEXT.card1Desc)} />
      <ValuePoint title={t(TEXT.card2Title)} desc={t(TEXT.card2Desc)} />
      <ValuePoint title={t(TEXT.card3Title)} desc={t(TEXT.card3Desc)} />
    </View>
  );
}

function WelcomeActions({ onStart, onLogin }: {
  readonly onStart: () => void;
  readonly onLogin: () => void;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing['20'],
        paddingTop: theme.spacing['12'],
        paddingBottom: Math.max(insets.bottom, theme.spacing['16']),
        backgroundColor: theme.colors.bgCanvas,
        borderTopWidth: 1,
        borderColor: theme.colors.borderSubtle,
        gap: theme.spacing['8'],
      }}
    >
      <Button
        variant="primary"
        size="lg"
        fullWidth
        label={t(TEXT.startOnboarding)}
        testID={TEST_ID.startButton}
        onPress={onStart}
      />
      <Button
        variant="secondary"
        size="md"
        fullWidth
        label={t(TEXT.haveAccount)}
        testID={TEST_ID.loginButton}
        onPress={onLogin}
      />
    </View>
  );
}

/* ── Screen Component ─────────────────────────────────── */

export function WelcomeScreen() {
  const t = useT();
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }}>
      <ScrollView
        testID={TEST_ID.screen}
        contentContainerStyle={{
          padding: theme.spacing['20'],
          gap: theme.spacing['20'],
          paddingBottom: theme.spacing['20'],
          alignItems: 'center',
        }}
      >
        <View style={{ alignItems: 'center', marginVertical: theme.spacing['16'] }}>
          <KwartjeMarkSvg size={64} />
        </View>
        <Text variant="display" style={{ textAlign: 'center' }}>
          {t(TEXT.welcomeTitle)}
        </Text>
        <WelcomeValueList />
        <Text variant="label" color="tertiary" style={{ textAlign: 'center' }}>
          {t(TEXT.readOnly)}
        </Text>
      </ScrollView>
      <WelcomeActions
        onStart={() => router.push('/(onboarding)/huishouden')}
        onLogin={() => router.push('/(auth)/inloggen')}
      />
    </View>
  );
}
