import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Money, ProgressBar, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { LocalEnvelope } from '@/features/budget';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  potjesTitle: 'potjes.title',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface TodayPotjesPreviewProps {
  readonly envelopes: readonly LocalEnvelope[];
}

interface TodayPotjeRowProps {
  readonly env: LocalEnvelope;
  readonly isFirst: boolean;
  readonly onPress: () => void;
}

function TodayPotjeRow({ env, isFirst, onPress }: TodayPotjeRowProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        gap: theme.spacing['8'],
        paddingTop: isFirst ? 0 : theme.spacing['12'],
        borderTopWidth: isFirst ? 0 : 1,
        borderTopColor: theme.colors.borderSubtle,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="body" numberOfLines={1} style={{ fontWeight: '500' }}>
          {env.name}
        </Text>
        <Money cents={env.currentCents} variant="label" />
      </View>
      <ProgressBar
        testID={`progress-${env.id}`}
        value={env.currentCents}
        max={env.targetCents}
        accessibilityLabel={env.name}
        tone={env.currentCents >= env.targetCents ? 'accent' : env.isBehind ? 'warn' : 'accent'}
      />
    </Pressable>
  );
}

/* ── Component ────────────────────────────────────────── */

export function TodayPotjesPreview({ envelopes }: TodayPotjesPreviewProps) {
  const t = useT();
  const router = useRouter();
  const { theme } = useTheme();

  if (envelopes.length === 0) return null;

  return (
    <View style={{ gap: theme.spacing['12'] }}>
      <Text variant="title">{t(TEXT.potjesTitle)}</Text>
      <View
        style={{
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.bgSurface,
          padding: theme.spacing['16'],
          gap: theme.spacing['16'],
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
        }}
      >
        {envelopes.slice(0, 2).map((env, i) => (
          <TodayPotjeRow
            key={env.id}
            env={env}
            isFirst={i === 0}
            onPress={() => router.push('/(tabs)/potjes')}
          />
        ))}
      </View>
    </View>
  );
}
