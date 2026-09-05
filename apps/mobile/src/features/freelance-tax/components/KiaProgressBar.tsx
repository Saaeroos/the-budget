import { View } from 'react-native';
import { Card, Money, ProgressBar, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import {
  cents,
  computeKiaDeduction,
  KIA_LOWER_THRESHOLD_CENTS,
  type Cents,
} from '@shared';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'freelance.kia_title',
  thresholdLabel: 'freelance.kia_threshold_label',
  unlockedLabel: 'freelance.kia_unlocked_label',
  remainingNotice: 'freelance.kia_remaining_notice',
} as const;

/* ── Types ────────────────────────────────────────────── */
export interface KiaProgressBarProps {
  readonly totalInvestmentsCents: Cents;
}

/* ── Implementation ───────────────────────────────────── */
export function KiaProgressBar({ totalInvestmentsCents }: KiaProgressBarProps) {
  const t = useT();
  const { theme } = useTheme();

  const kiaDeduction = computeKiaDeduction(totalInvestmentsCents);
  const isUnlocked = totalInvestmentsCents >= KIA_LOWER_THRESHOLD_CENTS;
  const remainingCents = cents(Math.max(0, KIA_LOWER_THRESHOLD_CENTS - totalInvestmentsCents));

  return (
    <Card
      style={{
        padding: theme.spacing['16'],
        gap: theme.spacing['12'],
        backgroundColor: theme.colors.bgSurface,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="title" color="primary">
          {t(TEXT.title)}
        </Text>
        <Money cents={totalInvestmentsCents} variant="label" color="secondary" />
      </View>

      <ProgressBar
        value={totalInvestmentsCents}
        max={KIA_LOWER_THRESHOLD_CENTS}
        testID="kia-progress-bar"
        accessibilityLabel={t(TEXT.title)}
      />

      {isUnlocked ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="label" color="positive" style={{ fontWeight: '600' }}>
            {t(TEXT.unlockedLabel)}
          </Text>
          <Money cents={kiaDeduction} variant="title" color="positive" />
        </View>
      ) : (
        <View style={{ gap: theme.spacing['4'] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="label" color="secondary">
              {t(TEXT.thresholdLabel)}
            </Text>
            <Money cents={cents(KIA_LOWER_THRESHOLD_CENTS)} variant="label" color="secondary" />
          </View>
          <Text variant="label" color="accent">
            {t(TEXT.remainingNotice, { amount: (remainingCents / 100).toFixed(0) })}
          </Text>
        </View>
      )}
    </Card>
  );
}
