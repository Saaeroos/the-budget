import { ScrollView, View } from 'react-native';
import { Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { LocalUpcomingBill } from '@/features/budget';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  upcoming: 'today.upcoming',
  upcomingEmpty: 'today.upcoming_empty',
  settlementCard: 'today.settlement_card',
} as const;

const TEST_ID = {
  upcomingList: 'today-upcoming-list',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface TodayUpcomingListProps {
  readonly bills: readonly LocalUpcomingBill[];
}

/* ── Sub-components ───────────────────────────────────── */

function UpcomingBillChip({ bill }: { readonly bill: LocalUpcomingBill }) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View
      style={{
        width: 170,
        padding: theme.spacing['16'],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.bgSurface,
        gap: theme.spacing['8'],
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="label" color="secondary">
          {bill.dueOn.slice(5)}
        </Text>
        {bill.id === 'bill-creditcard' && (
          <View
            style={{
              paddingHorizontal: theme.spacing['4'],
              paddingVertical: theme.spacing['2'],
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.bgSubtle,
            }}
          >
            <Text variant="label" color="accent">
              {t(TEXT.settlementCard)}
            </Text>
          </View>
        )}
      </View>
      <Text variant="body" numberOfLines={1} style={{ fontWeight: '500' }}>
        {bill.name}
      </Text>
      <Money cents={bill.amountCents} variant="label" />
    </View>
  );
}

/* ── Component ────────────────────────────────────────── */

export function TodayUpcomingList({ bills }: TodayUpcomingListProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View style={{ gap: theme.spacing['12'] }} testID={TEST_ID.upcomingList}>
      <Text variant="title">{t(TEXT.upcoming)}</Text>
      {bills.length === 0 ? (
        <View
          style={{
            padding: theme.spacing['16'],
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.bgSurface,
          }}
        >
          <Text variant="body" color="secondary">
            {t(TEXT.upcomingEmpty)}
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.spacing['12'] }}
        >
          {bills.map((bill) => (
            <UpcomingBillChip key={bill.id} bill={bill} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
