import { View } from 'react-native';
import { cents, type Cents } from '@shared';
import { Card, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { AnnualTaxReturn, ZzpDeductions } from '../types';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'freelance.profit_waterfall_title',
  annualIncome: 'freelance.annual_income',
  annualExpenses: 'freelance.annual_expenses',
  annualProfit: 'freelance.annual_profit',
  deductions: 'freelance.zelfstandigenaftrek',
  mkbVrijstelling: 'freelance.mkb_vrijstelling',
  taxableIncome: 'freelance.taxable_income',
  estimatedTax: 'freelance.estimated_tax',
} as const;

/* ── Types ────────────────────────────────────────────── */

export interface ProfitWaterfallChartProps {
  readonly annualReturn: AnnualTaxReturn;
}

interface StepRowProps {
  readonly label: string;
  readonly amount: Cents;
  readonly isNegative?: boolean | undefined;
  readonly isSubtotal?: boolean | undefined;
  readonly isFinal?: boolean | undefined;
  readonly highlightColor?: 'primary' | 'positive' | 'accent' | 'danger' | undefined;
}

/* ── Sub-components ───────────────────────────────────── */

function getRowStyle(isFinal?: boolean, isSubtotal?: boolean) {
  if (isFinal) {
    return { py: 8, border: 1, textVariant: 'body-lg' as const, moneyVariant: 'title' as const, isBold: true };
  }
  if (isSubtotal) {
    return { py: 4, border: 1, textVariant: 'body' as const, moneyVariant: 'body-lg' as const, isBold: true };
  }
  return { py: 2, border: 0, textVariant: 'label' as const, moneyVariant: 'label' as const, isBold: false };
}

function StepRow({ label, amount, isNegative, isSubtotal, isFinal, highlightColor = 'primary' }: StepRowProps) {
  const { theme } = useTheme();
  const cfg = getRowStyle(isFinal, isSubtotal);
  const displayAmount = isNegative ? cents(-Math.abs(amount)) : amount;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: cfg.py,
        borderTopWidth: cfg.border,
        borderTopColor: theme.colors.borderSubtle,
      }}
    >
      <Text variant={cfg.textVariant} color={cfg.isBold ? 'primary' : 'secondary'}>
        {label}
      </Text>
      <Money cents={displayAmount} variant={cfg.moneyVariant} color={highlightColor} />
    </View>
  );
}

function DeductionsSection({ deductions, taxableIncome }: { readonly deductions: ZzpDeductions; readonly taxableIncome: Cents }) {
  const t = useT();
  if (deductions.totalDeductionsCents <= 0) return null;

  return (
    <>
      {deductions.zelfstandigenaftrekCents > 0 && (
        <StepRow label={t(TEXT.deductions)} amount={deductions.zelfstandigenaftrekCents} isNegative />
      )}
      {deductions.mkbVrijstellingCents > 0 && (
        <StepRow label={t(TEXT.mkbVrijstelling)} amount={deductions.mkbVrijstellingCents} isNegative />
      )}
      <StepRow label={t(TEXT.taxableIncome)} amount={taxableIncome} isSubtotal />
    </>
  );
}

/* ── Component ────────────────────────────────────────── */

export function ProfitWaterfallChart({ annualReturn }: ProfitWaterfallChartProps) {
  const t = useT();
  const { theme } = useTheme();
  const { grossIncomeCents, deductibleExpensesCents, profitCents, deductions, taxableIncomeCents, totalTaxDueCents } = annualReturn;
  const netRetained = cents(Math.max(0, profitCents - totalTaxDueCents));

  return (
    <Card padded style={{ gap: theme.spacing['12'], borderRadius: theme.radius.xl }}>
      <Text variant="title">{t(TEXT.title)}</Text>
      <View style={{ gap: theme.spacing['2'] }}>
        <StepRow label={t(TEXT.annualIncome)} amount={grossIncomeCents} />
        <StepRow label={t(TEXT.annualExpenses)} amount={deductibleExpensesCents} isNegative />
        <StepRow label={t(TEXT.annualProfit)} amount={profitCents} isSubtotal />
        <DeductionsSection deductions={deductions} taxableIncome={taxableIncomeCents} />
        <StepRow label={t(TEXT.estimatedTax)} amount={totalTaxDueCents} isNegative highlightColor="danger" />
        <StepRow label="Netto winst (na belasting)" amount={netRetained} isFinal highlightColor="positive" />
      </View>
    </Card>
  );
}
