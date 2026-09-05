import { useCallback, useState } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomBackButton, Button, Card, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { useBudgetStore, type LocalAccount } from '@/features/budget';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'household.title',
  subtitle: 'household.subtitle',
  members: 'household.members',
  memberYou: 'household.member_you',
  memberPartner: 'household.member_partner',
  memberPending: 'household.member_pending',
  roleOwner: 'household.role_owner',
  inviteCta: 'household.invite_cta',
  inviteDesc: 'household.invite_desc',
  inviteMessage: 'household.invite_message',
  inviteCodeLabel: 'household.invite_code_label',
  inviteShare: 'household.invite_share',
  inviteCopied: 'household.invite_copied',
  sharedAccounts: 'household.shared_accounts',
  splitRatio: 'household.split_ratio',
  splitEqual: 'household.split_equal',
} as const;

const TEST_ID = {
  screen: 'instellingen-huishouden-screen',
  inviteButton: 'household-invite-button',
} as const;

const INVITE_CODE = 'KW-8492';
const INVITE_URL = `https://kwartje.app/join?code=${INVITE_CODE}`;

/* ── Sub-components ───────────────────────────────────── */

function MembersCard() {
  const t = useT();
  const { theme } = useTheme();

  return (
    <Card padded style={{ gap: theme.spacing['16'], borderRadius: theme.radius.xl }}>
      <Text variant="title">{t(TEXT.members)}</Text>
      <View style={{ gap: theme.spacing['12'] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="body" style={{ fontWeight: '500' }}>{t(TEXT.memberYou)}</Text>
          <Text variant="label" color="accent">{t(TEXT.roleOwner)}</Text>
        </View>
        <View style={{ height: 1, backgroundColor: theme.colors.borderSubtle }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="body" color="secondary">{t(TEXT.memberPartner)}</Text>
          <View style={{ paddingHorizontal: theme.spacing['8'], paddingVertical: theme.spacing['2'], borderRadius: theme.radius.full, backgroundColor: theme.colors.bgSubtle }}>
            <Text variant="label" color="secondary">{t(TEXT.memberPending)}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

function InviteCard({ onShare, copied }: { readonly onShare: () => void; readonly copied: boolean }) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <Card padded style={{ gap: theme.spacing['16'], borderRadius: theme.radius.xl }}>
      <View style={{ gap: theme.spacing['4'] }}>
        <Text variant="title">{t(TEXT.inviteCta)}</Text>
        <Text variant="body" color="secondary">
          {t(TEXT.inviteDesc)}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: theme.spacing['12'],
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.bgSubtle,
        }}
      >
        <Text variant="label" color="secondary">
          {t(TEXT.inviteCodeLabel)}
        </Text>
        <Text variant="body-lg" style={{ fontWeight: '700', letterSpacing: 1.5 }}>
          {INVITE_CODE}
        </Text>
      </View>
      <Button
        variant="primary"
        size="md"
        label={copied ? t(TEXT.inviteCopied) : t(TEXT.inviteShare)}
        testID={TEST_ID.inviteButton}
        onPress={onShare}
      />
    </Card>
  );
}

function SharedAccountsCard({ accounts }: { readonly accounts: readonly LocalAccount[] }) {
  const t = useT();
  const { theme } = useTheme();
  const shared = accounts.filter((a) => a.scope === 'household' || a.type === 'joint');

  return (
    <Card padded style={{ gap: theme.spacing['16'], borderRadius: theme.radius.xl }}>
      <View style={{ gap: theme.spacing['4'] }}>
        <Text variant="title">{t(TEXT.sharedAccounts)}</Text>
        <Text variant="label" color="secondary">
          {t(TEXT.splitRatio)}: {t(TEXT.splitEqual)}
        </Text>
      </View>
      <View style={{ gap: theme.spacing['8'] }}>
        {shared.map((acc) => (
          <View key={acc.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ gap: theme.spacing['2'] }}>
              <Text variant="body" style={{ fontWeight: '500' }}>
                {acc.name}
              </Text>
              <Text variant="label" color="secondary">
                {acc.iban}
              </Text>
            </View>
            <Money cents={acc.balanceCents} variant="body" />
          </View>
        ))}
      </View>
    </Card>
  );
}

/* ── Screen Component ─────────────────────────────────── */

export function HouseholdSettingsScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const accounts = useBudgetStore((s) => s.accounts);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    setCopied(true);
    try {
      await Share.share({
        message: t(TEXT.inviteMessage, { url: INVITE_URL, code: INVITE_CODE }),
      });
    } catch {
      // Ignored
    }
  }, [t]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas, paddingTop: insets.top }}>
      <ScrollView
        testID={TEST_ID.screen}
        contentContainerStyle={{
          padding: theme.spacing['20'],
          gap: theme.spacing['20'],
          paddingBottom: Math.max(insets.bottom, theme.spacing['24']),
        }}
      >
        <View style={{ gap: theme.spacing['4'] }}>
          <Text variant="title-lg">{t(TEXT.title)}</Text>
          <Text variant="body" color="secondary">
            {t(TEXT.subtitle)}
          </Text>
        </View>

        <MembersCard />
        <InviteCard onShare={handleShare} copied={copied} />
        <SharedAccountsCard accounts={accounts} />
      </ScrollView>
      <BottomBackButton />
    </View>
  );
}
