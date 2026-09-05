import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { BottomBackButton, Button, Card, Money, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { computeMileageSummary, computeTripAllowance, nlDate } from '@shared';
import type { BusinessTrip, MileageSummary } from '../types';
import { MileageSummaryCard } from '../components/MileageSummaryCard';
import { AddTripModal } from '../components/AddTripModal';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'freelance.mileage_screen_title',
  subtitle: 'freelance.mileage_screen_subtitle',
  payoutButton: 'freelance.payout_allowance',
  addTripButton: 'freelance.add_trip_button',
  emptyTrips: 'freelance.no_trips_yet',
  roundTripTag: 'freelance.round_trip_tag',
} as const;

/* ── Fixtures (initial state) ─────────────────────────── */
const INITIAL_TRIPS: readonly BusinessTrip[] = [
  {
    id: 'trip-1',
    tripDate: nlDate('2026-08-12'),
    departureLocation: 'Amsterdam',
    destinationLocation: 'Utrecht',
    distanceKm: 38.5,
    isRoundTrip: true,
    rateCentsPerKm: 23,
    purpose: 'Klantworkshop FinTech',
    vehicleType: 'private',
    reimbursedAt: '2026-08-31T12:00:00Z',
  },
  {
    id: 'trip-2',
    tripDate: nlDate('2026-08-25'),
    departureLocation: 'Amsterdam',
    destinationLocation: 'Rotterdam',
    distanceKm: 74,
    isRoundTrip: false,
    rateCentsPerKm: 23,
    purpose: 'Project kick-off',
    vehicleType: 'private',
  },
];

interface HeaderProps {
  readonly summary: MileageSummary;
  readonly onPayout: () => void;
  readonly onAddTrip: () => void;
}

function MileageHeader({ summary, onPayout, onAddTrip }: HeaderProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View style={{ gap: theme.spacing['16'], marginBottom: theme.spacing['8'] }}>
      <View style={{ gap: theme.spacing['4'] }}>
        <Text variant="display" color="primary">{t(TEXT.title)}</Text>
        <Text variant="body" color="secondary">{t(TEXT.subtitle)}</Text>
      </View>

      <MileageSummaryCard summary={summary} />

      {summary.pendingReimbursementCents > 0 && (
        <Button
          label={`${t(TEXT.payoutButton)} (${(summary.pendingReimbursementCents / 100).toFixed(2)} €)`}
          variant="primary"
          size="md"
          onPress={onPayout}
        />
      )}

      <Button label={t(TEXT.addTripButton)} variant="secondary" size="md" onPress={onAddTrip} />
    </View>
  );
}

function TripItemCard({ item }: { readonly item: BusinessTrip }) {
  const t = useT();
  const { theme } = useTheme();
  const allowance = computeTripAllowance(item.distanceKm, item.isRoundTrip, {
    rateCentsPerKm: item.rateCentsPerKm,
    isPrivateVehicle: item.vehicleType === 'private',
  });
  const totalKm = item.isRoundTrip ? item.distanceKm * 2 : item.distanceKm;

  return (
    <Card style={{ padding: theme.spacing['12'], gap: theme.spacing['4'], backgroundColor: theme.colors.bgSurface }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="title" color="primary">{item.departureLocation} → {item.destinationLocation}</Text>
        <Money cents={allowance} variant="title" color="positive" />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="label" color="secondary">
          {item.tripDate} · {totalKm} km {item.isRoundTrip ? `(${t(TEXT.roundTripTag)})` : ''}
        </Text>
        <Text variant="label" color={item.reimbursedAt ? 'positive' : 'secondary'}>
          {item.reimbursedAt ? '✓ Uitgekeerd' : 'Nog te verrekenen'}
        </Text>
      </View>

      <Text variant="body" color="secondary">{item.purpose}</Text>
    </Card>
  );
}

/* ── Implementation ───────────────────────────────────── */
export function MileageScreen() {
  const t = useT();
  const { theme } = useTheme();

  const [trips, setTrips] = useState<readonly BusinessTrip[]>(INITIAL_TRIPS);
  const [modalVisible, setModalVisible] = useState(false);

  const summary = useMemo(() => computeMileageSummary(trips), [trips]);

  const handleAddTrip = (newTripData: Omit<BusinessTrip, 'id'>) => {
    const newTrip: BusinessTrip = { ...newTripData, id: `trip-${Date.now()}` };
    setTrips([newTrip, ...trips]);
  };

  const handlePayout = () => {
    const nowIso = new Date().toISOString();
    setTrips(trips.map((tr) => (tr.reimbursedAt ? tr : { ...tr, reimbursedAt: nowIso })));
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }}>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: theme.spacing['16'],
          gap: theme.spacing['12'],
          paddingBottom: theme.spacing['40'],
        }}
        ListHeaderComponent={
          <MileageHeader
            summary={summary}
            onPayout={handlePayout}
            onAddTrip={() => setModalVisible(true)}
          />
        }
        renderItem={({ item }) => <TripItemCard item={item} />}
        ListEmptyComponent={
          <Text variant="body" color="secondary" style={{ textAlign: 'center', marginTop: 24 }}>
            {t(TEXT.emptyTrips)}
          </Text>
        }
        ListFooterComponent={<BottomBackButton style={{ marginTop: theme.spacing['16'] }} />}
      />

      <AddTripModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddTrip}
      />
    </View>
  );
}
