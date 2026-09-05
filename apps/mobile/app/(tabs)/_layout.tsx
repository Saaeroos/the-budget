import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { NavTodaySvg, NavTransactionsSvg, NavPotjesSvg, NavOverzichtSvg, useTheme } from '@/ui';
import { useT } from '@/i18n';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  today: 'today.title',
  transactions: 'transactions.title',
  potjes: 'potjes.title',
  overzicht: 'overzicht.title',
} as const;

/* ── Implementation ───────────────────────────────────── */

export default function TabsLayout() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accentBg,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarStyle: {
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: Math.max(insets.bottom, 16),
          height: 64,
          borderRadius: 32,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.borderSubtle,
          backgroundColor: 'transparent',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
          height: 64,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={95}
            tint={theme.scheme === 'dark' ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden' }]}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t(TEXT.today),
          tabBarIcon: ({ color, focused }) => (
            <NavTodaySvg size={22} color={typeof color === 'string' ? color : undefined} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="transacties/index"
        options={{
          title: t(TEXT.transactions),
          tabBarIcon: ({ color, focused }) => (
            <NavTransactionsSvg size={22} color={typeof color === 'string' ? color : undefined} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="potjes/index"
        options={{
          title: t(TEXT.potjes),
          tabBarIcon: ({ color, focused }) => (
            <NavPotjesSvg size={22} color={typeof color === 'string' ? color : undefined} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="overzicht/index"
        options={{
          title: t(TEXT.overzicht),
          tabBarIcon: ({ color, focused }) => (
            <NavOverzichtSvg size={22} color={typeof color === 'string' ? color : undefined} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="transacties/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="potjes/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="overzicht/trends"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="overzicht/categorie/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
