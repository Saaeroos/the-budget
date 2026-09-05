import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '../ThemeProvider';
import type { BudgetSvgProps } from './types';

/* ── Implementation ───────────────────────────────────── */

export function NavTodaySvg({ size = 24, color, focused, testID, accessibilityLabel }: BudgetSvgProps) {
  const { theme } = useTheme();
  const strokeColor = color ?? (focused ? theme.colors.accentBg : theme.colors.textSecondary);

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...(testID ? { testID } : {})}
      {...(accessibilityLabel ? { accessibilityLabel } : {})}
    >
      <Rect x={3} y={5} width={18} height={16} rx={3} stroke={strokeColor} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M3 10H21" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" />
      <Path d="M8 3V6" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" />
      <Path d="M16 3V6" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={15} r={focused ? 2.5 : 2} fill={strokeColor} />
    </Svg>
  );
}

export function NavTransactionsSvg({ size = 24, color, focused, testID, accessibilityLabel }: BudgetSvgProps) {
  const { theme } = useTheme();
  const strokeColor = color ?? (focused ? theme.colors.accentBg : theme.colors.textSecondary);

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...(testID ? { testID } : {})}
      {...(accessibilityLabel ? { accessibilityLabel } : {})}
    >
      <Path d="M17 8H3M3 8L7 4M3 8L7 12" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 16H21M21 16L17 12M21 16L17 20" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function NavAddSvg({ size = 24, testID, accessibilityLabel }: BudgetSvgProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...(testID ? { testID } : {})}
      {...(accessibilityLabel ? { accessibilityLabel } : {})}
    >
      <Circle cx={12} cy={12} r={10} fill="#12A184" />
      <Path d="M12 7V17M7 12H17" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

export function NavPotjesSvg({ size = 24, color, focused, testID, accessibilityLabel }: BudgetSvgProps) {
  const { theme } = useTheme();
  const strokeColor = color ?? (focused ? theme.colors.accentBg : theme.colors.textSecondary);

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...(testID ? { testID } : {})}
      {...(accessibilityLabel ? { accessibilityLabel } : {})}
    >
      <Rect x={7} y={2} width={10} height={3} rx={1} stroke={strokeColor} strokeWidth={2} />
      <Path
        d="M5.5 7H18.5C19.6 7 20.4 7.9 20.3 9L19.2 18.2C19.1 19.8 17.7 21 16.1 21H7.9C6.3 21 4.9 19.8 4.8 18.2L3.7 9C3.6 7.9 4.4 7 5.5 7Z"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinejoin="round"
        fill={focused ? `${theme.colors.accentBg}22` : 'none'}
      />
      <Circle cx={12} cy={14} r={2.5} stroke={strokeColor} strokeWidth={1.75} fill={focused ? strokeColor : 'none'} />
    </Svg>
  );
}

export function NavOverzichtSvg({ size = 24, color, focused, testID, accessibilityLabel }: BudgetSvgProps) {
  const { theme } = useTheme();
  const strokeColor = color ?? (focused ? theme.colors.accentBg : theme.colors.textSecondary);

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...(testID ? { testID } : {})}
      {...(accessibilityLabel ? { accessibilityLabel } : {})}
    >
      <Path
        d="M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3V12H21Z"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinejoin="round"
        fill={focused ? `${theme.colors.accentBg}22` : 'none'}
      />
      <Path
        d="M15 3.35C18.28 4.49 20.51 7.72 20.65 11H15V3.35Z"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinejoin="round"
        fill={focused ? strokeColor : 'none'}
      />
    </Svg>
  );
}

export function NavBackSvg({ size = 24, color, testID, accessibilityLabel }: BudgetSvgProps) {
  const { theme } = useTheme();
  const strokeColor = color ?? theme.colors.textPrimary;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...(testID ? { testID } : {})}
      {...(accessibilityLabel ? { accessibilityLabel } : {})}
    >
      <Path d="M15 18L9 12L15 6" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function NavSettingsSvg({ size = 24, color, testID, accessibilityLabel }: BudgetSvgProps) {
  const { theme } = useTheme();
  const strokeColor = color ?? theme.colors.textSecondary;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...(testID ? { testID } : {})}
      {...(accessibilityLabel ? { accessibilityLabel } : {})}
    >
      <Path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
