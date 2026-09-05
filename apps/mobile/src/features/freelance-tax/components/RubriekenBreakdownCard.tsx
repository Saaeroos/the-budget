import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { BtwAangifte, TaxQuarter } from '../types';
import { FilingStatusBadge } from './FilingStatusBadge';
import { RubriekRow } from './RubriekRow';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  deadline: 'freelance.btw_deadline',
  r1a: 'freelance.rubriek_1a',
  r1b: 'freelance.rubriek_1b',
  r1e: 'freelance.rubriek_1e',
  r1f: 'freelance.rubriek_1f',
  r4a: 'freelance.rubriek_4a',
  r5b: 'freelance.rubriek_5b',
  r5g: 'freelance.rubriek_5g',
  toPay: 'freelance.btw_to_pay',
  toReceive: 'freelance.btw_to_receive',
  markFiled: 'freelance.btw_mark_filed',
  markUnfiled: 'freelance.btw_mark_unfiled',
  copyValues: 'freelance.btw_copy_values',
  copiedNotice: 'freelance.btw_copied',
} as const;

/* ── Types ────────────────────────────────────────────── */

export interface RubriekenBreakdownCardProps {
  readonly quarter: TaxQuarter;
  readonly aangifte: BtwAangifte;
  readonly onToggleFiled: () => void;
}

interface CardActionButtonsProps {
  readonly copied: boolean;
  readonly isFiled: boolean;
  readonly onCopy: () => void;
  readonly onToggle: () => void;
}

/* ── Sub-components ───────────────────────────────────── */

function CardActionButtons({ copied, isFiled, onCopy, onToggle }: CardActionButtonsProps) {
  const t = useT();
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
      <View style={{ flex: 1 }}>
        <Button variant="secondary" label={copied ? t(TEXT.copiedNotice) : t(TEXT.copyValues)} onPress={onCopy} />
      </View>
      <View style={{ flex: 1 }}>
        <Button
          variant={isFiled ? 'secondary' : 'primary'}
          label={isFiled ? t(TEXT.markUnfiled) : t(TEXT.markFiled)}
          onPress={onToggle}
        />
      </View>
    </View>
  );
}

/* ── Component ────────────────────────────────────────── */

export function RubriekenBreakdownCard({ quarter, aangifte, onToggleFiled }: RubriekenBreakdownCardProps) {
  const t = useT();
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const r = aangifte.rubrieken;
  const isFiled = aangifte.status === 'filed';
  const payLabel = aangifte.totalDueCents >= 0 ? t(TEXT.toPay) : t(TEXT.toReceive);
  const label5g = `${t(TEXT.r5g)} (${payLabel})`;

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card
      padded
      style={{
        gap: theme.spacing['12'],
        borderRadius: theme.radius.xl,
        borderWidth: 1.5,
        borderColor: isFiled ? theme.colors.statusPositive : theme.colors.borderSubtle,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ gap: theme.spacing['2'] }}>
          <Text variant="title">{quarter.label}</Text>
          <Text variant="label" color="secondary">
            {t(TEXT.deadline, { date: quarter.filingDeadline, days: 56 })}
          </Text>
        </View>
        <FilingStatusBadge status={aangifte.status} />
      </View>

      <View style={{ gap: theme.spacing['8'], marginTop: theme.spacing['8'] }}>
        <RubriekRow code="1a" label={t(TEXT.r1a)} amountCents={r.rubriek1bBtwCents} secondaryAmountCents={r.rubriek1aOmzetCents} secondaryLabel="Omzet" />
        <RubriekRow code="1e" label={t(TEXT.r1e)} amountCents={r.rubriek1fBtwCents} secondaryAmountCents={r.rubriek1eOmzetCents} secondaryLabel="Omzet" />
        <RubriekRow code="4a" label={t(TEXT.r4a)} amountCents={r.rubriek4aOmzetCents} />
        <RubriekRow code="5b" label={t(TEXT.r5b)} amountCents={r.rubriek5bVoorbelastingCents} isNegative />
        <RubriekRow code="5g" label={label5g} amountCents={r.rubriek5gSubtotaalCents} isTotal />
      </View>

      <CardActionButtons copied={copied} isFiled={isFiled} onCopy={handleCopy} onToggle={onToggleFiled} />
    </Card>
  );
}
