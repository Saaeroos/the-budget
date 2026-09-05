import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { cents, formatEUR, type Cents, type SafeToSpend } from '@shared';
import { Money, SafeToSpendSvg, Text, WarningOverbudgetSvg, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { LocalAccount } from '@/features/budget';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  safeToSpend: 'today.safe_to_spend',
  safeToSpendSub: 'today.safe_to_spend_sub',
  shortfallTitle: 'today.shortfall_title',
  shortfallDesc: 'today.shortfall_desc',
  overdraftAlert: 'today.overdraft_alert',
  overdraftLimit: 'today.overdraft_limit',
  creditcardLabel: 'today.creditcard_label',
  simulateOverdraft: 'today.simulate_overdraft',
  restoreBalance: 'today.restore_balance',
  perDay: 'today.per_day',
  checkingAccount: 'today.checking_account',
  daysRemaining: 'today.days_remaining',
  balanceToggle: 'today.balance_toggle',
} as const;

const TEST_ID = {
  heroCard: 'today-hero-card',
  heroAmount: 'today-hero-amount',
} as const;

/* ── Types ────────────────────────────────────────────── */

export interface TodayHeroCardProps {
  readonly sts: SafeToSpend;
  readonly totalBalanceCents: Cents;
  readonly checkingAccount?: LocalAccount | undefined;
  readonly cardAccount?: LocalAccount | undefined;
  readonly onToggleSimulateOverdraft?: (() => void) | undefined;
}

/* ── Sub-components ───────────────────────────────────── */

function HeroHeader({
  isShortfall,
  showBalance,
  isOverdrawn,
  onToggleSimulate,
}: {
  readonly isShortfall: boolean;
  readonly showBalance: boolean;
  readonly isOverdrawn: boolean;
  readonly onToggleSimulate?: (() => void) | undefined;
}) {
  const t = useT();
  const { theme } = useTheme();

  let titleKey: string = TEXT.safeToSpend;
  if (showBalance) titleKey = TEXT.balanceToggle;
  else if (isShortfall) titleKey = TEXT.shortfallTitle;

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing['8'] }}>
        {isShortfall ? <WarningOverbudgetSvg size={24} /> : <SafeToSpendSvg size={24} />}
        <Text variant="label" color={isShortfall ? 'danger' : 'secondary'} style={{ fontWeight: '600' }}>
          {t(titleKey, { amount: '' })}
        </Text>
      </View>
      {onToggleSimulate && (
        <Pressable
          onPress={onToggleSimulate}
          accessibilityRole="button"
          style={{
            paddingHorizontal: theme.spacing['8'],
            paddingVertical: theme.spacing['4'],
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.bgSubtle,
          }}
        >
          <Text variant="label" color="secondary">
            {isOverdrawn ? t(TEXT.restoreBalance) : t(TEXT.simulateOverdraft)}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function HeroMainAmount({
  amount,
  isShortfall,
  subline,
  onPress,
}: {
  readonly amount: Cents;
  readonly isShortfall: boolean;
  readonly subline: string;
  readonly onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Money
        cents={amount}
        variant="display"
        color={isShortfall ? 'danger' : 'primary'}
        testID={TEST_ID.heroAmount}
      />
      <Text variant="body" color={isShortfall ? 'danger' : 'secondary'} style={{ marginTop: theme.spacing['4'] }}>
        {subline}
      </Text>
    </Pressable>
  );
}

function OverdraftBanner({ account }: { readonly account: LocalAccount }) {
  const t = useT();
  const { theme } = useTheme();
  const limit = account.creditLimitCents ?? cents(100000);
  const overdrawn = cents(Math.abs(account.balanceCents));
  const remaining = cents(Math.max(0, limit - overdrawn));

  return (
    <View
      style={{
        padding: theme.spacing['12'],
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.bgSubtle,
        borderWidth: 1,
        borderColor: theme.colors.statusWarn,
        gap: theme.spacing['4'],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing['8'] }}>
        <WarningOverbudgetSvg size={18} />
        <Text variant="label" color="danger" style={{ fontWeight: '600' }}>
          {t(TEXT.overdraftAlert, { amount: formatEUR(overdrawn) })}
        </Text>
      </View>
      <Text variant="label" color="secondary">
        {t(TEXT.overdraftLimit, { limit: formatEUR(limit), remaining: formatEUR(remaining) })}
      </Text>
    </View>
  );
}

interface MetricsRowProps {
  readonly perDay: Cents;
  readonly checkingBalance: Cents;
  readonly cardBalance?: Cents | undefined;
  readonly daysLeft: number;
}

function MetricsRow({ perDay, checkingBalance, cardBalance, daysLeft }: MetricsRowProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: theme.spacing['12'],
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderSubtle,
      }}
    >
      <View style={{ gap: theme.spacing['2'] }}>
        <Text variant="label" color="secondary">
          {t(TEXT.perDay)}
        </Text>
        <Money cents={perDay} variant="label" />
      </View>
      <View style={{ gap: theme.spacing['2'] }}>
        <Text variant="label" color="secondary">
          {t(TEXT.checkingAccount)}
        </Text>
        <Money cents={checkingBalance} variant="label" color={checkingBalance < 0 ? 'danger' : 'primary'} />
      </View>
      {cardBalance !== undefined && (
        <View style={{ gap: theme.spacing['2'] }}>
          <Text variant="label" color="secondary">
            {t(TEXT.creditcardLabel)}
          </Text>
          <Money cents={cardBalance} variant="label" />
        </View>
      )}
      <View style={{ gap: theme.spacing['2'], alignItems: 'flex-end' }}>
        <Text variant="label" color="secondary">
          {t(TEXT.daysRemaining, { days: daysLeft })}
        </Text>
      </View>
    </View>
  );
}

/* ── Component ────────────────────────────────────────── */

export function TodayHeroCard({
  sts,
  totalBalanceCents,
  checkingAccount,
  cardAccount,
  onToggleSimulateOverdraft,
}: TodayHeroCardProps) {
  const t = useT();
  const { theme } = useTheme();
  const [showBalance, setShowBalance] = useState(false);

  const isShortfall = sts.amount < 0;
  const isOverdrawn = checkingAccount ? checkingAccount.balanceCents < 0 : false;

  const subline = isShortfall
    ? t(TEXT.shortfallDesc, { amount: formatEUR(cents(Math.abs(sts.amount))) })
    : t(TEXT.safeToSpendSub, { days: sts.daysLeft, perDay: formatEUR(sts.perDay) });

  return (
    <View
      testID={TEST_ID.heroCard}
      style={{
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.bgSurface,
        padding: theme.spacing['20'],
        gap: theme.spacing['16'],
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
      }}
    >
      <HeroHeader
        isShortfall={isShortfall}
        showBalance={showBalance}
        isOverdrawn={isOverdrawn}
        onToggleSimulate={onToggleSimulateOverdraft}
      />
      <HeroMainAmount
        amount={showBalance ? totalBalanceCents : sts.amount}
        isShortfall={isShortfall}
        subline={showBalance ? t(TEXT.balanceToggle, { amount: formatEUR(totalBalanceCents) }) : subline}
        onPress={() => setShowBalance((prev) => !prev)}
      />
      {isOverdrawn && checkingAccount && <OverdraftBanner account={checkingAccount} />}
      <MetricsRow
        perDay={sts.perDay}
        checkingBalance={checkingAccount?.balanceCents ?? totalBalanceCents}
        cardBalance={cardAccount?.balanceCents}
        daysLeft={sts.daysLeft}
      />
    </View>
  );
}
