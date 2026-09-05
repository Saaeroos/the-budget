import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { useOnboardingStore } from '../store/useOnboardingStore';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'onboarding.bank.title',
  subtitle: 'onboarding.bank.subtitle',
  searchPlaceholder: 'onboarding.bank.search_placeholder',
  popularBanks: 'onboarding.bank.popular_banks',
  manualCta: 'onboarding.bank.manual_cta',
  manualDesc: 'onboarding.bank.manual_desc',
  abnNotice: 'banks.notice.abn_creditcard',
} as const;

const TEST_ID = {
  screen: 'bank-choice-screen',
  searchInput: 'bank-search-input',
  manualButton: 'bank-manual-button',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface BankItem {
  readonly id: string;
  readonly name: string;
  readonly noticeKey?: string;
}

const NL_BANKS: readonly BankItem[] = [
  { id: 'ing', name: 'ING' },
  { id: 'rabobank', name: 'Rabobank' },
  { id: 'abnamro', name: 'ABN AMRO', noticeKey: TEXT.abnNotice },
  { id: 'bunq', name: 'bunq' },
  { id: 'sns', name: 'SNS' },
  { id: 'asnbank', name: 'ASN Bank' },
  { id: 'regiobank', name: 'RegioBank' },
  { id: 'triodos', name: 'Triodos Bank' },
];

interface BankListProps {
  readonly banks: readonly BankItem[];
  readonly onSelect: (bank: BankItem) => void;
}

/* ── Sub-components ───────────────────────────────────── */

function BankList({ banks, onSelect }: BankListProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View style={{ gap: theme.spacing['12'] }}>
      <Text variant="label" color="secondary">
        {t(TEXT.popularBanks)}
      </Text>
      {banks.map((bank) => (
        <Pressable
          key={bank.id}
          testID={`bank-item-${bank.id}`}
          accessibilityRole="button"
          onPress={() => onSelect(bank)}
          style={({ pressed }) => ({
            backgroundColor: theme.colors.bgSurface,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.borderSubtle,
            padding: theme.spacing['16'],
            gap: theme.spacing['4'],
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text variant="title">{bank.name}</Text>
          {bank.noticeKey && (
            <Text variant="label" color="tertiary">
              {t(bank.noticeKey)}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

function ManualBankFooter({ onManualStart }: { readonly onManualStart: () => void }) {
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
        gap: theme.spacing['4'],
      }}
    >
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        label={t(TEXT.manualCta)}
        testID={TEST_ID.manualButton}
        onPress={onManualStart}
      />
      <Text variant="label" color="tertiary" style={{ textAlign: 'center' }}>
        {t(TEXT.manualDesc)}
      </Text>
    </View>
  );
}

function BankSearchInput({ value, onChange }: { readonly value: string; readonly onChange: (val: string) => void }) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <TextInput
      testID={TEST_ID.searchInput}
      placeholder={t(TEXT.searchPlaceholder)}
      placeholderTextColor={theme.colors.textTertiary}
      value={value}
      onChangeText={onChange}
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
  );
}

/* ── Screen Component ─────────────────────────────────── */

export function BankChoiceScreen() {
  const t = useT();
  const router = useRouter();
  const { theme } = useTheme();
  const setBank = useOnboardingStore((s) => s.setBank);
  const setStep = useOnboardingStore((s) => s.setStep);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBanks = NL_BANKS.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  const handleSelectBank = (bank: BankItem): void => {
    setBank({ selectedBankId: bank.id, isManual: false });
    setStep(3);
    router.push({
      pathname: '/(onboarding)/bank-koppelen/[institutionId]',
      params: { institutionId: bank.id },
    });
  };

  const handleManualStart = (): void => {
    setBank({ selectedBankId: null, isManual: true });
    setStep(4);
    router.push('/(onboarding)/categorieen');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }}>
      <ScrollView
        testID={TEST_ID.screen}
        contentContainerStyle={{
          padding: theme.spacing['20'],
          gap: theme.spacing['20'],
          paddingBottom: theme.spacing['20'],
        }}
      >
        <View style={{ gap: theme.spacing['8'] }}>
          <Text variant="title-lg">{t(TEXT.title)}</Text>
          <Text variant="body" color="secondary">
            {t(TEXT.subtitle)}
          </Text>
        </View>
        <BankSearchInput value={searchQuery} onChange={setSearchQuery} />
        <BankList banks={filteredBanks} onSelect={handleSelectBank} />
      </ScrollView>
      <ManualBankFooter onManualStart={handleManualStart} />
    </View>
  );
}
