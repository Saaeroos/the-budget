import { Pressable, View } from 'react-native';
import { Text, useTheme } from '@/ui';
import { useT } from '@/i18n';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  review: 'today.review',
  reviewUncategorisedOne: 'today.review_uncategorised_one',
  reviewUncategorisedOther: 'today.review_uncategorised_other',
} as const;

const TEST_ID = {
  reviewCard: 'today-review-card',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface TodayReviewCardProps {
  readonly unreviewedCount: number;
  readonly onPress: () => void;
}

/* ── Component ────────────────────────────────────────── */

export function TodayReviewCard({ unreviewedCount, onPress }: TodayReviewCardProps) {
  const t = useT();
  const { theme } = useTheme();

  if (unreviewedCount === 0) return null;

  const label =
    unreviewedCount === 1
      ? t(TEXT.reviewUncategorisedOne)
      : t(TEXT.reviewUncategorisedOther, { count: unreviewedCount });

  return (
    <Pressable testID={TEST_ID.reviewCard} onPress={onPress} accessibilityRole="button">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing['16'],
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.bgSurface,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing['12'], flex: 1 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.accentBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="label" color="inverse" style={{ fontWeight: '700' }}>
              {unreviewedCount}
            </Text>
          </View>
          <View style={{ gap: theme.spacing['2'], flex: 1 }}>
            <Text variant="label" color="secondary">
              {t(TEXT.review)}
            </Text>
            <Text variant="body" numberOfLines={1}>
              {label}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
