import { View } from 'react-native';
import { Button, Card, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  appleCta: 'onboarding.account.apple_cta',
  googleCta: 'onboarding.account.google_cta',
  localGuestCta: 'onboarding.account.local_guest_cta',
  localGuestDesc: 'onboarding.account.local_guest_desc',
} as const;

const TEST_ID = {
  appleButton: 'onboarding-apple-button',
  googleButton: 'onboarding-google-button',
  localGuestButton: 'onboarding-local-guest-button',
} as const;

/* ── Props ────────────────────────────────────────────── */
interface AccountAuthOptionsProps {
  readonly onSelect: () => void;
}

/* ── Component ────────────────────────────────────────── */
export function AccountAuthOptions({ onSelect }: AccountAuthOptionsProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View style={{ width: '100%', gap: theme.spacing['16'] }}>
      <View style={{ width: '100%', gap: theme.spacing['8'] }}>
        <Button
          variant="secondary"
          size="md"
          fullWidth
          label={t(TEXT.appleCta)}
          testID={TEST_ID.appleButton}
          onPress={onSelect}
        />
        <Button
          variant="secondary"
          size="md"
          fullWidth
          label={t(TEXT.googleCta)}
          testID={TEST_ID.googleButton}
          onPress={onSelect}
        />
      </View>
      <Card padded>
        <Button
          variant="ghost"
          size="md"
          fullWidth
          label={t(TEXT.localGuestCta)}
          testID={TEST_ID.localGuestButton}
          onPress={onSelect}
        />
        <Text variant="label" color="tertiary" style={{ textAlign: 'center' }}>
          {t(TEXT.localGuestDesc)}
        </Text>
      </Card>
    </View>
  );
}
