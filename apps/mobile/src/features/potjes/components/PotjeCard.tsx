import { Pressable, View } from 'react-native';
import { Car, Landmark, PiggyBank, Plane, Shield, Sparkles } from 'lucide-react-native';
import { Card, Money, ProgressBar, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import type { LocalEnvelope } from '@/features/budget';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  onTrack: 'potjes.on_track',
  done: 'potjes.done',
  behind: 'potjes.behind',
  target: 'potjes.target',
  perMonth: 'potjes.per_month',
  deposit: 'potjes.deposit',
} as const;

/* ── Types ────────────────────────────────────────────── */

interface PotjeCardProps {
  readonly envelope: LocalEnvelope;
  readonly onPress?: () => void;
  readonly onDeposit?: () => void;
}

function PotjeIconBadge({ icon }: { readonly icon?: string | undefined }) {
  const { theme } = useTheme();
  const idOrIcon = (icon ?? '').toLowerCase();
  let IconComponent = PiggyBank;

  if (idOrIcon.includes('car') || idOrIcon.includes('auto')) {
    IconComponent = Car;
  } else if (idOrIcon.includes('vacation') || idOrIcon.includes('vakantie') || idOrIcon.includes('reis')) {
    IconComponent = Plane;
  } else if (idOrIcon.includes('buffer') || idOrIcon.includes('nood') || idOrIcon.includes('shield')) {
    IconComponent = Shield;
  } else if (idOrIcon.includes('btw') || idOrIcon.includes('tax') || idOrIcon.includes('belasting')) {
    IconComponent = Landmark;
  } else if (idOrIcon.includes('gift') || idOrIcon.includes('feest')) {
    IconComponent = Sparkles;
  }

  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <IconComponent size={20} color={theme.colors.accentBg} strokeWidth={2} />
    </View>
  );
}

function PotjeStatusBadge({
  isComplete,
  statusLabel,
}: {
  readonly isComplete: boolean;
  readonly statusLabel: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: theme.spacing['8'],
        paddingVertical: theme.spacing['4'],
        borderRadius: theme.radius.sm,
        backgroundColor: isComplete ? theme.colors.accentBg : theme.colors.bgSubtle,
      }}
    >
      <Text variant="label" color={isComplete ? 'inverse' : 'secondary'}>
        {statusLabel}
      </Text>
    </View>
  );
}

function PotjeAmountProgress({
  currentCents,
  targetCents,
}: {
  readonly currentCents: LocalEnvelope['currentCents'];
  readonly targetCents: LocalEnvelope['targetCents'];
}) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing['4'] }}>
      <Money cents={currentCents} variant="title" />
      <Text variant="label" color="secondary">
        /
      </Text>
      <Money cents={targetCents} variant="label" />
    </View>
  );
}

function PotjeDepositButton({ onDeposit }: { readonly onDeposit: () => void }) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onDeposit}
      accessibilityRole="button"
      style={{
        paddingHorizontal: theme.spacing['12'],
        paddingVertical: theme.spacing['4'],
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.accentBg,
      }}
    >
      <Text variant="label" color="inverse">
        {t(TEXT.deposit)}
      </Text>
    </Pressable>
  );
}

/* ── Component ────────────────────────────────────────── */

export function PotjeCard({ envelope, onPress, onDeposit }: PotjeCardProps) {
  const t = useT();
  const { theme } = useTheme();

  const isComplete = envelope.currentCents >= envelope.targetCents;
  const statusLabel = isComplete
    ? t(TEXT.done)
    : envelope.isBehind
      ? t(TEXT.behind, { amount: '' })
      : t(TEXT.onTrack);

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card padded style={{ gap: theme.spacing['12'] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing['12'],
              flex: 1,
              paddingRight: theme.spacing['8'],
            }}
          >
            <PotjeIconBadge icon={envelope.icon || envelope.id} />
            <View style={{ gap: theme.spacing['2'], flex: 1 }}>
              <Text variant="body" numberOfLines={1} style={{ fontWeight: '600' }}>
                {envelope.name}
              </Text>
              <Text variant="label" color="secondary">
                {t(TEXT.perMonth, { amount: `€ ${Math.round(envelope.monthlyCents / 100)}` })}
              </Text>
            </View>
          </View>
          <PotjeStatusBadge isComplete={isComplete} statusLabel={statusLabel} />
        </View>

        <ProgressBar
          testID={`potje-progress-${envelope.id}`}
          value={envelope.currentCents}
          max={envelope.targetCents}
          accessibilityLabel={envelope.name}
          tone={isComplete ? 'accent' : envelope.isBehind ? 'warn' : 'accent'}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <PotjeAmountProgress
            currentCents={envelope.currentCents}
            targetCents={envelope.targetCents}
          />
          {onDeposit && <PotjeDepositButton onDeposit={onDeposit} />}
        </View>
      </Card>
    </Pressable>
  );
}
