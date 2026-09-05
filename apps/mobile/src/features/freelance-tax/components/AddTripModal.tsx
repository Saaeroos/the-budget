import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Button, Text, useTheme } from '@/ui';
import { useT } from '@/i18n';
import { nlDate } from '@shared';
import type { BusinessTrip, VehicleType } from '../types';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'freelance.add_trip_title',
  departureLabel: 'freelance.departure_label',
  destinationLabel: 'freelance.destination_label',
  distanceLabel: 'freelance.distance_label',
  purposeLabel: 'freelance.purpose_label',
  roundTripLabel: 'freelance.round_trip_label',
  privateVehicle: 'freelance.vehicle_private',
  businessVehicle: 'freelance.vehicle_business',
  saveButton: 'freelance.save_trip',
  cancelButton: 'freelance.cancel',
} as const;

/* ── Types ────────────────────────────────────────────── */
export interface AddTripModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSave: (trip: Omit<BusinessTrip, 'id'>) => void;
}

interface FormProps {
  readonly departure: string;
  readonly setDeparture: (v: string) => void;
  readonly destination: string;
  readonly setDestination: (v: string) => void;
  readonly distanceKmStr: string;
  readonly setDistanceKmStr: (v: string) => void;
  readonly isRoundTrip: boolean;
  readonly setIsRoundTrip: (v: boolean) => void;
  readonly purpose: string;
  readonly setPurpose: (v: string) => void;
  readonly vehicleType: VehicleType;
  readonly setVehicleType: (v: VehicleType) => void;
  readonly onClose: () => void;
  readonly onSave: () => void;
}

function TripVehicleSelector({ vehicleType, setVehicleType }: { readonly vehicleType: VehicleType; readonly setVehicleType: (v: VehicleType) => void }) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing['8'], marginTop: theme.spacing['8'] }}>
      {(['private', 'business'] as const).map((vt) => {
        const isSelected = vehicleType === vt;
        const label = vt === 'private' ? `${t(TEXT.privateVehicle)} (€0,23/km)` : t(TEXT.businessVehicle);
        return (
          <Pressable
            key={vt}
            onPress={() => setVehicleType(vt)}
            style={{
              flex: 1,
              padding: theme.spacing['8'],
              borderRadius: theme.radius.md,
              backgroundColor: isSelected ? `${theme.colors.statusPositive}20` : theme.colors.bgSubtle,
              borderWidth: 1,
              borderColor: isSelected ? theme.colors.statusPositive : theme.colors.borderSubtle,
            }}
          >
            <Text variant="label" color={isSelected ? 'positive' : 'secondary'} style={{ textAlign: 'center', fontWeight: '600' }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TripFormContent(props: FormProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View style={[styles.sheet, { backgroundColor: theme.colors.bgSurface, paddingBottom: theme.spacing['24'] }]}>
      <Text variant="title" color="primary" style={{ marginBottom: theme.spacing['16'] }}>{t(TEXT.title)}</Text>
      <ScrollView contentContainerStyle={{ gap: theme.spacing['12'] }}>
        <View style={{ gap: theme.spacing['4'] }}>
          <Text variant="label" color="secondary">{t(TEXT.departureLabel)}</Text>
          <TextInput value={props.departure} onChangeText={props.setDeparture} placeholder="bijv. Amsterdam" placeholderTextColor={theme.colors.textTertiary} style={[styles.input, { borderColor: theme.colors.borderSubtle, color: theme.colors.textPrimary }]} />
        </View>
        <View style={{ gap: theme.spacing['4'] }}>
          <Text variant="label" color="secondary">{t(TEXT.destinationLabel)}</Text>
          <TextInput value={props.destination} onChangeText={props.setDestination} placeholder="bijv. Utrecht" placeholderTextColor={theme.colors.textTertiary} style={[styles.input, { borderColor: theme.colors.borderSubtle, color: theme.colors.textPrimary }]} />
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing['12'] }}>
          <View style={{ flex: 1, gap: theme.spacing['4'] }}>
            <Text variant="label" color="secondary">{t(TEXT.distanceLabel)}</Text>
            <TextInput value={props.distanceKmStr} onChangeText={props.setDistanceKmStr} placeholder="0" keyboardType="numeric" placeholderTextColor={theme.colors.textTertiary} style={[styles.input, { borderColor: theme.colors.borderSubtle, color: theme.colors.textPrimary }]} />
          </View>
          <Pressable onPress={() => props.setIsRoundTrip(!props.isRoundTrip)} style={{ flex: 1, justifyContent: 'center', padding: theme.spacing['8'], borderRadius: theme.radius.md, backgroundColor: props.isRoundTrip ? `${theme.colors.statusPositive}20` : theme.colors.bgSubtle, borderWidth: 1, borderColor: props.isRoundTrip ? theme.colors.statusPositive : theme.colors.borderSubtle, marginTop: 18 }}>
            <Text variant="label" color={props.isRoundTrip ? 'positive' : 'secondary'} style={{ textAlign: 'center', fontWeight: '600' }}>
              {props.isRoundTrip ? '✓ ' + t(TEXT.roundTripLabel) : t(TEXT.roundTripLabel)}
            </Text>
          </Pressable>
        </View>
        <View style={{ gap: theme.spacing['4'] }}>
          <Text variant="label" color="secondary">{t(TEXT.purposeLabel)}</Text>
          <TextInput value={props.purpose} onChangeText={props.setPurpose} placeholder="bijv. Klantbezoek" placeholderTextColor={theme.colors.textTertiary} style={[styles.input, { borderColor: theme.colors.borderSubtle, color: theme.colors.textPrimary }]} />
        </View>
        <TripVehicleSelector vehicleType={props.vehicleType} setVehicleType={props.setVehicleType} />
        <View style={{ flexDirection: 'row', gap: theme.spacing['12'], marginTop: theme.spacing['16'] }}>
          <View style={{ flex: 1 }}><Button label={t(TEXT.cancelButton)} variant="secondary" size="md" onPress={props.onClose} fullWidth /></View>
          <View style={{ flex: 1 }}><Button label={t(TEXT.saveButton)} variant="primary" size="md" onPress={props.onSave} fullWidth /></View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ── Implementation ───────────────────────────────────── */
export function AddTripModal({ visible, onClose, onSave }: AddTripModalProps) {
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [distanceKmStr, setDistanceKmStr] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [vehicleType, setVehicleType] = useState<VehicleType>('private');

  const handleSave = () => {
    const km = parseFloat(distanceKmStr.replace(',', '.'));
    if (!departure || !destination || isNaN(km) || km <= 0) return;
    onSave({
      tripDate: nlDate('2026-09-05'),
      departureLocation: departure.trim(),
      destinationLocation: destination.trim(),
      distanceKm: km,
      isRoundTrip,
      rateCentsPerKm: 23,
      purpose: purpose.trim() || 'Zakelijke rit',
      vehicleType,
    });
    setDeparture('');
    setDestination('');
    setDistanceKmStr('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <TripFormContent
              departure={departure} setDeparture={setDeparture}
              destination={destination} setDestination={setDestination}
              distanceKmStr={distanceKmStr} setDistanceKmStr={setDistanceKmStr}
              isRoundTrip={isRoundTrip} setIsRoundTrip={setIsRoundTrip}
              purpose={purpose} setPurpose={setPurpose}
              vehicleType={vehicleType} setVehicleType={setVehicleType}
              onClose={onClose} onSave={handleSave}
            />
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
});
