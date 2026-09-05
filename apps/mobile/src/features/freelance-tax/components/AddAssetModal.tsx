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
import { cents, isAssetInvestment, nlDate } from '@shared';
import type { AssetCategory, BusinessAsset } from '../types';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  title: 'freelance.add_asset_title',
  nameLabel: 'freelance.asset_name_label',
  costLabel: 'freelance.asset_cost_label',
  categoryLabel: 'freelance.asset_category_label',
  lifespanLabel: 'freelance.asset_lifespan_label',
  residualLabel: 'freelance.asset_residual_label',
  saveButton: 'freelance.save_asset',
  cancelButton: 'freelance.cancel',
  depreciationNotice: 'freelance.asset_depreciation_notice',
} as const;

const CATEGORIES: readonly AssetCategory[] = ['hardware', 'phone', 'furniture', 'tools', 'other'];

/* ── Types ────────────────────────────────────────────── */
export interface AddAssetModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSave: (asset: Omit<BusinessAsset, 'id'>) => void;
}

interface FormContentProps {
  readonly name: string;
  readonly setName: (v: string) => void;
  readonly costStr: string;
  readonly setCostStr: (v: string) => void;
  readonly category: AssetCategory;
  readonly setCategory: (cat: AssetCategory) => void;
  readonly lifespanYearsStr: string;
  readonly setLifespanYearsStr: (v: string) => void;
  readonly residualStr: string;
  readonly setResidualStr: (v: string) => void;
  readonly qualifies: boolean;
  readonly onClose: () => void;
  readonly onSave: () => void;
}

function AssetCategorySelector({ category, onSelect }: { readonly category: AssetCategory; readonly onSelect: (cat: AssetCategory) => void }) {
  const { theme } = useTheme();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['8'] }}>
      {CATEGORIES.map((cat) => {
        const isSelected = category === cat;
        return (
          <Pressable
            key={cat}
            onPress={() => onSelect(cat)}
            style={{
              paddingHorizontal: theme.spacing['12'],
              paddingVertical: theme.spacing['4'],
              borderRadius: theme.radius.sm,
              backgroundColor: isSelected ? `${theme.colors.statusPositive}20` : theme.colors.bgSubtle,
              borderWidth: 1,
              borderColor: isSelected ? theme.colors.statusPositive : theme.colors.borderSubtle,
            }}
          >
            <Text variant="label" color={isSelected ? 'positive' : 'secondary'} style={{ fontWeight: '600' }}>
              {cat}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AssetFormContent(props: FormContentProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View style={[styles.sheet, { backgroundColor: theme.colors.bgSurface, paddingBottom: theme.spacing['24'] }]}>
      <Text variant="title" color="primary" style={{ marginBottom: theme.spacing['16'] }}>{t(TEXT.title)}</Text>
      <ScrollView contentContainerStyle={{ gap: theme.spacing['12'] }}>
        <View style={{ gap: theme.spacing['4'] }}>
          <Text variant="label" color="secondary">{t(TEXT.nameLabel)}</Text>
          <TextInput value={props.name} onChangeText={props.setName} placeholder="bijv. MacBook Pro 16 inch" placeholderTextColor={theme.colors.textTertiary} style={[styles.input, { borderColor: theme.colors.borderSubtle, color: theme.colors.textPrimary }]} />
        </View>
        <View style={{ gap: theme.spacing['4'] }}>
          <Text variant="label" color="secondary">{t(TEXT.costLabel)}</Text>
          <TextInput value={props.costStr} onChangeText={props.setCostStr} placeholder="0.00" keyboardType="numeric" placeholderTextColor={theme.colors.textTertiary} style={[styles.input, { borderColor: theme.colors.borderSubtle, color: theme.colors.textPrimary }]} />
          {props.qualifies && <Text variant="label" color="accent">{t(TEXT.depreciationNotice)}</Text>}
        </View>
        <View style={{ gap: theme.spacing['4'] }}>
          <Text variant="label" color="secondary">{t(TEXT.categoryLabel)}</Text>
          <AssetCategorySelector category={props.category} onSelect={props.setCategory} />
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing['12'] }}>
          <View style={{ flex: 1, gap: theme.spacing['4'] }}>
            <Text variant="label" color="secondary">{t(TEXT.lifespanLabel)}</Text>
            <TextInput value={props.lifespanYearsStr} onChangeText={props.setLifespanYearsStr} keyboardType="numeric" placeholderTextColor={theme.colors.textTertiary} style={[styles.input, { borderColor: theme.colors.borderSubtle, color: theme.colors.textPrimary }]} />
          </View>
          <View style={{ flex: 1, gap: theme.spacing['4'] }}>
            <Text variant="label" color="secondary">{t(TEXT.residualLabel)}</Text>
            <TextInput value={props.residualStr} onChangeText={props.setResidualStr} keyboardType="numeric" placeholderTextColor={theme.colors.textTertiary} style={[styles.input, { borderColor: theme.colors.borderSubtle, color: theme.colors.textPrimary }]} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing['12'], marginTop: theme.spacing['16'] }}>
          <View style={{ flex: 1 }}><Button label={t(TEXT.cancelButton)} variant="secondary" size="md" onPress={props.onClose} fullWidth /></View>
          <View style={{ flex: 1 }}><Button label={t(TEXT.saveButton)} variant="primary" size="md" onPress={props.onSave} fullWidth /></View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ── Implementation ───────────────────────────────────── */
export function AddAssetModal({ visible, onClose, onSave }: AddAssetModalProps) {
  const [name, setName] = useState('');
  const [costStr, setCostStr] = useState('');
  const [category, setCategory] = useState<AssetCategory>('hardware');
  const [lifespanYearsStr, setLifespanYearsStr] = useState('5');
  const [residualStr, setResidualStr] = useState('0');

  const costEuros = parseFloat(costStr.replace(',', '.')) || 0;
  const costCentsVal = cents(Math.round(costEuros * 100));
  const qualifies = isAssetInvestment(costCentsVal);

  const handleSave = () => {
    if (!name || costEuros <= 0) return;
    const lifespanYears = parseInt(lifespanYearsStr, 10) || 5;
    const residualEuros = parseFloat(residualStr.replace(',', '.')) || 0;

    onSave({
      name: name.trim(), category, purchaseDate: nlDate('2026-09-05'),
      purchaseCostCents: costCentsVal, residualValueCents: cents(Math.round(residualEuros * 100)),
      lifespanMonths: lifespanYears * 12, btwRate: 21,
      btwAmountCents: cents(Math.round(costCentsVal * 0.21)), isKiaEligible: true,
    });
    setName(''); setCostStr(''); setResidualStr('0'); onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <AssetFormContent
              name={name} setName={setName} costStr={costStr} setCostStr={setCostStr}
              category={category} setCategory={setCategory}
              lifespanYearsStr={lifespanYearsStr} setLifespanYearsStr={setLifespanYearsStr}
              residualStr={residualStr} setResidualStr={setResidualStr}
              qualifies={qualifies} onClose={onClose} onSave={handleSave}
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
