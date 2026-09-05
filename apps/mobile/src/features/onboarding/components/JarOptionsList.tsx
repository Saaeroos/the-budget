import { Pressable, View } from 'react-native';
import { type Cents } from '@shared';
import {
  BucketReserveringenSvg,
  JaarafrekeningSvg,
  NoodfondsBufferSvg,
  Text,
  useTheme,
} from '@/ui';
import { useT } from '@/i18n';

/* ── Text ─────────────────────────────────────────────── */
// (none — translatable title/desc keys passed in via PresetJar)

/* ── Types ────────────────────────────────────────────── */

export interface PresetJar {
  readonly id: string;
  readonly titleKey: string;
  readonly descKey: string;
  readonly targetCents: Cents;
  readonly monthlyCents: Cents;
  readonly iconType: 'car' | 'vacation' | 'buffer';
}

export interface JarOptionsListProps {
  readonly jars: readonly [PresetJar, ...PresetJar[]];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
}

/* ── Component ────────────────────────────────────────── */

function renderJarIcon(type: PresetJar['iconType']) {
  switch (type) {
    case 'car':
      return <JaarafrekeningSvg size={36} />;
    case 'vacation':
      return <BucketReserveringenSvg size={36} />;
    case 'buffer':
      return <NoodfondsBufferSvg size={36} />;
  }
}

export function JarOptionsList({ jars, selectedId, onSelect }: JarOptionsListProps) {
  const t = useT();
  const { theme } = useTheme();

  return (
    <View style={{ gap: theme.spacing['12'] }}>
      {jars.map((jar) => {
        const isSelected = jar.id === selectedId;
        return (
          <Pressable
            key={jar.id}
            testID={`jar-option-${jar.id}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(jar.id)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isSelected ? theme.colors.bgSurfaceRaised : theme.colors.bgSubtle,
              borderRadius: theme.radius.lg,
              borderWidth: 2,
              borderColor: isSelected ? theme.colors.accentBg : theme.colors.borderSubtle,
              padding: theme.spacing['16'],
              gap: theme.spacing['16'],
              opacity: pressed ? 0.9 : 1,
            })}
          >
            {renderJarIcon(jar.iconType)}
            <View style={{ flex: 1, gap: theme.spacing['4'] }}>
              <Text variant="title">{t(jar.titleKey)}</Text>
              <Text variant="body" color="secondary">
                {t(jar.descKey)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
