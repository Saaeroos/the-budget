import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, KwartjeMarkSvg, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import {
  useFirstEnvelope,
  useHouseholdData,
  useOnboardingStore,
} from '../store/useOnboardingStore';
import { AccountAuthOptions } from '../components/AccountAuthOptions';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'onboarding.account.title',
  subtitle: 'onboarding.account.subtitle',
  summaryBadge: 'onboarding.account.summary_badge',
  emailLabel: 'onboarding.account.email_label',
  emailPlaceholder: 'onboarding.account.email_placeholder',
  primaryCta: 'onboarding.account.primary_cta',
  loginLink: 'onboarding.account.login_link',
  single: 'onboarding.huishouden.single',
  partner: 'onboarding.huishouden.partner',
  family: 'onboarding.huishouden.family',
} as const;

const TEST_ID = {
  screen: 'onboarding-account-screen',
  emailInput: 'onboarding-email-input',
  createAccountButton: 'onboarding-create-account-button',
  loginLink: 'onboarding-login-link',
} as const;

/* ── Sub-components ───────────────────────────────────── */

function AccountHeader() {
  const t = useT();
  const { theme } = useTheme();

  return (
    <>
      <View style={{ alignItems: 'center', marginVertical: theme.spacing['8'] }}>
        <KwartjeMarkSvg size={56} />
      </View>
      <Text variant="title-lg">{t(TEXT.title)}</Text>
      <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
        {t(TEXT.subtitle)}
      </Text>
    </>
  );
}

function EmailInputField({ email, onEmailChange }: {
  readonly email: string;
  readonly onEmailChange: (val: string) => void;
}) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View style={{ width: '100%', gap: theme.spacing['8'] }}>
      <Text variant="label" color="secondary">
        {t(TEXT.emailLabel)}
      </Text>
      <TextInput
        testID={TEST_ID.emailInput}
        placeholder={t(TEXT.emailPlaceholder)}
        placeholderTextColor={theme.colors.textTertiary}
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{
          height: 48,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.bgSubtle,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          paddingHorizontal: theme.spacing['16'],
          color: theme.colors.textPrimary,
          fontSize: 16,
        }}
      />
    </View>
  );
}

function AccountFooter({ onSubmit, onLogin }: {
  readonly onSubmit: () => void;
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
        gap: theme.spacing['12'],
      }}
    >
      <Button
        variant="primary"
        size="lg"
        fullWidth
        label={t(TEXT.primaryCta)}
        testID={TEST_ID.createAccountButton}
        onPress={onSubmit}
      />
      <Pressable onPress={onLogin} testID={TEST_ID.loginLink} accessibilityRole="button">
        <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
          {t(TEXT.loginLink)}
        </Text>
      </Pressable>
    </View>
  );
}

/* ── Screen Component ─────────────────────────────────── */

export function AccountScreen() {
  const t = useT();
  const router = useRouter();
  const { theme } = useTheme();
  const household = useHouseholdData();
  const firstEnvelope = useFirstEnvelope();
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const [email, setEmail] = useState('');

  const householdLabel =
    household.composition === 'family'
      ? t(TEXT.family)
      : household.composition === 'partner'
        ? t(TEXT.partner)
        : t(TEXT.single);

  const handleFinish = (): void => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

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
        <AccountHeader />
        <View
          style={{
            backgroundColor: theme.colors.accentSoft,
            paddingHorizontal: theme.spacing['16'],
            paddingVertical: theme.spacing['8'],
            borderRadius: theme.radius.full,
          }}
        >
          <Text variant="label" color="accent" style={{ textAlign: 'center', fontWeight: '600' }}>
            {t(TEXT.summaryBadge, { household: householdLabel, potje: firstEnvelope?.name ?? 'Potje' })}
          </Text>
        </View>
        <EmailInputField email={email} onEmailChange={setEmail} />
        <AccountAuthOptions onSelect={handleFinish} />
      </ScrollView>
      <AccountFooter onSubmit={handleFinish} onLogin={() => router.push('/(auth)/inloggen')} />
    </View>
  );
}
