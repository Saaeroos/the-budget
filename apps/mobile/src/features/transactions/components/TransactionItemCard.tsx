import { Pressable, StyleSheet, View } from 'react-native';
import { Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { LocalTransaction } from '@/features/budget';
import { CategoryBadge } from './CategoryBadge';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  tagBusiness: 'freelance.tag_business',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface TransactionItemCardProps {
  readonly transaction: LocalTransaction;
  readonly onPress?: (() => void) | undefined;
  readonly grouped?: boolean | undefined;
  readonly isFirst?: boolean | undefined;
}

/* ── Sub-components ───────────────────────────────────── */

function TxTitleRow({ name, isUnreviewed }: { readonly name: string; readonly isUnreviewed: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing['8'] }}>
      {isUnreviewed && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.accentBg,
          }}
        />
      )}
      <Text variant="body" numberOfLines={1} style={{ fontWeight: '500' }}>
        {name}
      </Text>
    </View>
  );
}

function TxScopeBadge({ scope }: { readonly scope?: string | undefined }) {
  const t = useT();
  const { theme } = useTheme();
  if (scope !== 'business') return null;

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing['4'],
        paddingVertical: theme.spacing['2'],
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.bgSubtle,
      }}
    >
      <Text variant="label" color="accent" style={{ fontSize: 11 }}>
        {t(TEXT.tagBusiness)}
      </Text>
    </View>
  );
}

function TxDetails({
  name,
  description,
  categoryKey,
  isUnreviewed,
  scope,
}: {
  readonly name: string;
  readonly description: string;
  readonly categoryKey: string;
  readonly isUnreviewed: boolean;
  readonly scope?: string | undefined;
}) {
  const { theme } = useTheme();

  return (
    <View style={{ gap: theme.spacing['4'], flex: 1, paddingRight: theme.spacing['12'] }}>
      <TxTitleRow name={name} isUnreviewed={isUnreviewed} />
      <Text variant="label" color="secondary" numberOfLines={1}>
        {description}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing['8'], marginTop: theme.spacing['2'] }}>
        <CategoryBadge categoryKey={categoryKey} />
        <TxScopeBadge scope={scope} />
      </View>
    </View>
  );
}

/* ── Component ────────────────────────────────────────── */

export function TransactionItemCard({
  transaction,
  onPress,
  grouped,
  isFirst,
}: TransactionItemCardProps) {
  const { theme } = useTheme();
  const isUnreviewed = transaction.isReviewed === false;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: theme.spacing['12'],
          paddingHorizontal: theme.spacing['16'],
          backgroundColor: theme.colors.bgSurface,
        },
        grouped
          ? {
              borderTopWidth: isFirst ? 0 : StyleSheet.hairlineWidth,
              borderTopColor: theme.colors.borderSubtle,
            }
          : {
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              borderColor: isUnreviewed ? theme.colors.accentBg : theme.colors.borderSubtle,
            },
      ]}
    >
      <TxDetails
        name={transaction.counterpartyName}
        description={transaction.description}
        categoryKey={transaction.categoryKey}
        isUnreviewed={isUnreviewed}
        scope={transaction.scope}
      />
      <View style={{ alignItems: 'flex-end', gap: theme.spacing['4'] }}>
        <Money
          cents={transaction.amountCents}
          variant="body"
          color={transaction.amountCents > 0 ? 'positive' : 'primary'}
        />
        {!grouped && (
          <Text variant="label" color="secondary">
            {transaction.date}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
