import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { LayoutGrid, List, PiggyBank, PieChart } from 'lucide-react-native';
import { useT } from '@/i18n';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  today: 'today.title',
  transactions: 'transactions.title',
  potjes: 'potjes.title',
  overzicht: 'overzicht.title',
} as const;

/* ── Implementation ───────────────────────────────────── */

/**
 * `docs/05` §1 — 5 tabs, but the centre one is the FAB, not a route: it
 * opens the `modals/snel-toevoegen` sheet and is added once that sheet is
 * built (`NativeTabs.BottomAccessory`), not here.
 */
export default function TabsLayout() {
  const t = useT();

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon src={<LayoutGrid />} />
        <NativeTabs.Trigger.Label>{t(TEXT.today)}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="transacties">
        <NativeTabs.Trigger.Icon src={<List />} />
        <NativeTabs.Trigger.Label>{t(TEXT.transactions)}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="potjes">
        <NativeTabs.Trigger.Icon src={<PiggyBank />} />
        <NativeTabs.Trigger.Label>{t(TEXT.potjes)}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="overzicht">
        <NativeTabs.Trigger.Icon src={<PieChart />} />
        <NativeTabs.Trigger.Label>{t(TEXT.overzicht)}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
