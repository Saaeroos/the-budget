import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '@/i18n';
import { useTheme } from './ThemeProvider';
import { NavBackSvg } from './svg';

export interface BottomBackButtonProps {
  readonly fallbackHref?: Href<string> | string;
  readonly onPress?: () => void;
  readonly bottomOffset?: number;
  readonly testID?: string;
  readonly style?: StyleProp<ViewStyle>;
}

export function BottomBackButton({
  fallbackHref,
  onPress,
  bottomOffset = 0,
  testID = 'bottom-back-button',
  style,
}: BottomBackButtonProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const t = useT();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else if (fallbackHref) {
      router.replace(fallbackHref as Href<string>);
    } else {
      router.back();
    }
  };

  const bottomPosition = Math.max(insets.bottom, theme.spacing['12']) + bottomOffset;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      hitSlop={8}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          left: theme.spacing['16'],
          bottom: bottomPosition,
          backgroundColor: theme.colors.bgSurface,
          borderColor: theme.colors.borderSubtle,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
        style,
      ]}
    >
      <NavBackSvg size={20} color={theme.colors.accentBg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
    zIndex: 99,
  },
});
