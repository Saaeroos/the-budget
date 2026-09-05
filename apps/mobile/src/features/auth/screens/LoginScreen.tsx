import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, KwartjeMarkSvg, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { useOnboardingStore } from '@/features/onboarding';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'auth.title',
  emailLabel: 'auth.email_label',
  emailPlaceholder: 'auth.email_placeholder',
  sendCode: 'auth.send_code',
  appleCta: 'onboarding.account.apple_cta',
  googleCta: 'onboarding.account.google_cta',
  localLogin: 'auth.local_login',
  backToOnboarding: 'auth.back_to_onboarding',
  readOnly: 'banks.readonly',
} as const;

const TEST_ID = {
  screen: 'inloggen-screen',
  emailInput: 'login-email-input',
  submitButton: 'login-submit-button',
  appleButton: 'login-apple-button',
  googleButton: 'login-google-button',
  localButton: 'login-local-button',
  backLink: 'login-back-link',
} as const;

/* ── Sub-components ───────────────────────────────────── */

function LoginEmailInput({ email, onEmailChange }: {
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

function LoginSocialButtons({ onLogin }: { readonly onLogin: () => void }) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View style={{ width: '100%', gap: theme.spacing['8'] }}>
      <Button
        variant="secondary"
        size="md"
        fullWidth
        label={t(TEXT.appleCta)}
        testID={TEST_ID.appleButton}
        onPress={onLogin}
      />
      <Button
        variant="secondary"
        size="md"
        fullWidth
        label={t(TEXT.googleCta)}
        testID={TEST_ID.googleButton}
        onPress={onLogin}
      />
    </View>
  );
}

function LoginLocalButton({ onLogin }: { readonly onLogin: () => void }) {
  const t = useT();

  return (
    <Button
      variant="ghost"
      size="md"
      fullWidth
      label={t(TEXT.localLogin)}
      testID={TEST_ID.localButton}
      onPress={onLogin}
    />
  );
}

function LoginFooter({ onSubmit, onBack }: {
  readonly onSubmit: () => void;
  readonly onBack: () => void;
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
        label={t(TEXT.sendCode)}
        testID={TEST_ID.submitButton}
        onPress={onSubmit}
      />
      <Pressable onPress={onBack} testID={TEST_ID.backLink} accessibilityRole="button">
        <Text variant="body" color="accent" style={{ textAlign: 'center' }}>
          {t(TEXT.backToOnboarding)}
        </Text>
      </Pressable>
    </View>
  );
}

/* ── Screen Component ─────────────────────────────────── */

export function LoginScreen() {
  const t = useT();
  const router = useRouter();
  const { theme } = useTheme();
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const [email, setEmail] = useState('');

  const handleLogin = (): void => {
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
        <View style={{ alignItems: 'center', marginVertical: theme.spacing['12'] }}>
          <KwartjeMarkSvg size={56} />
        </View>
        <Text variant="title-lg">{t(TEXT.title)}</Text>
        <LoginEmailInput email={email} onEmailChange={setEmail} />
        <LoginSocialButtons onLogin={handleLogin} />
        <LoginLocalButton onLogin={handleLogin} />
        <Text variant="label" color="tertiary" style={{ textAlign: 'center', marginTop: theme.spacing['8'] }}>
          {t(TEXT.readOnly)}
        </Text>
      </ScrollView>
      <LoginFooter
        onSubmit={handleLogin}
        onBack={() => router.push('/(onboarding)/huishouden')}
      />
    </View>
  );
}
