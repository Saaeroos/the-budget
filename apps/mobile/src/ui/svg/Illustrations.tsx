import Svg, { Circle, Defs, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import type { BudgetSvgProps } from './types';

/* ── Types ────────────────────────────────────────────── */

export type { BudgetSvgProps } from './types';

/* ── Implementation ───────────────────────────────────── */

export function JaarafrekeningSvg({ size = 120, testID, accessibilityLabel }: BudgetSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...(testID ? { testID } : {})} {...(accessibilityLabel ? { accessibilityLabel } : {})}>
      <Defs>
        <LinearGradient id="ja-bg-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FBEFD6" />
          <Stop offset="100%" stopColor="#FBE4E1" />
        </LinearGradient>
      </Defs>
      <Rect width={120} height={120} rx={28} fill="url(#ja-bg-rn)" />
      <Rect x={2} y={2} width={116} height={116} rx={26} stroke="#E9AE3C" strokeWidth={2} strokeOpacity={0.3} />
      <Rect x={30} y={32} width={60} height={66} rx={8} fill="#FFFFFF" stroke="#4A5365" strokeWidth={2.5} />
      <Path d="M30 40c0-4.4 3.6-8 8-8h44c4.4 0 8 3.6 8 8v8H30v-8z" fill="#C13B31" stroke="#C13B31" strokeWidth={2.5} />
      <Rect x={44} y={26} width={4} height={10} rx={2} fill="#333A48" />
      <Rect x={72} y={26} width={4} height={10} rx={2} fill="#333A48" />
      <Polygon points="60,54 52,68 59,68 57,84 69,66 61,66" fill="#E9AE3C" stroke="#9A6300" strokeWidth={1.75} strokeLinejoin="round" />
      <Path d="M74 76c0 4-3 7-7 7s-7-3-7-7c0-5 5-10 7-14 2 4 7 9 7 14z" fill="#E0665C" stroke="#96271F" strokeWidth={1.5} opacity={0.85} />
    </Svg>
  );
}

export function NoodfondsBufferSvg({ size = 120, testID, accessibilityLabel }: BudgetSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...(testID ? { testID } : {})} {...(accessibilityLabel ? { accessibilityLabel } : {})}>
      <Defs>
        <LinearGradient id="nf-bg-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E3EDFB" />
          <Stop offset="100%" stopColor="#DFF4EE" />
        </LinearGradient>
      </Defs>
      <Rect width={120} height={120} rx={28} fill="url(#nf-bg-rn)" />
      <Rect x={2} y={2} width={116} height={116} rx={26} stroke="#12A184" strokeWidth={2} strokeOpacity={0.2} />
      <Circle cx={60} cy={60} r={38} fill="#E0665C" stroke="#96271F" strokeWidth={3} />
      <Path d="M60 22a38 38 0 0 1 27 11l-14 14a18 18 0 0 0-13-5z" fill="#FFFFFF" stroke="#96271F" strokeWidth={1.5} />
      <Path d="M98 60a38 38 0 0 1-11 27l-14-14a18 18 0 0 0 5-13z" fill="#FFFFFF" stroke="#96271F" strokeWidth={1.5} />
      <Path d="M60 98a38 38 0 0 1-27-11l14-14a18 18 0 0 0 13 5z" fill="#FFFFFF" stroke="#96271F" strokeWidth={1.5} />
      <Path d="M22 60a38 38 0 0 1 11-27l14 14a18 18 0 0 0-5 13z" fill="#FFFFFF" stroke="#96271F" strokeWidth={1.5} />
      <Circle cx={60} cy={60} r={18} fill="#12A184" stroke="#FFFFFF" strokeWidth={3} />
      <Path d="M62 55a4 4 0 0 0-5 3v1h5m-6 2h6m-6-2a4 4 0 0 0 5 3" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function ToeslagenSvg({ size = 120, testID, accessibilityLabel }: BudgetSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...(testID ? { testID } : {})} {...(accessibilityLabel ? { accessibilityLabel } : {})}>
      <Defs>
        <LinearGradient id="ts-bg-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#DFF4EE" />
          <Stop offset="100%" stopColor="#FBEFD6" />
        </LinearGradient>
      </Defs>
      <Rect width={120} height={120} rx={28} fill="url(#ts-bg-rn)" />
      <Rect x={2} y={2} width={116} height={116} rx={26} stroke="#12A184" strokeWidth={2} strokeOpacity={0.25} />
      <Rect x={24} y={42} width={72} height={50} rx={6} fill="#FFFFFF" stroke="#1B4FA0" strokeWidth={2.5} />
      <Path d="M25 44l35 26 35-26" stroke="#1B4FA0" strokeWidth={2.5} strokeLinejoin="round" />
      <Circle cx={60} cy={42} r={14} fill="#E9AE3C" stroke="#9A6300" strokeWidth={2} />
      <Polygon points="52,46 54,38 57,42 60,36 63,42 66,38 68,46" fill="#9A6300" />
      <Circle cx={84} cy={30} r={11} fill="#12A184" stroke="#FFFFFF" strokeWidth={2} />
      <Path d="M84 25v10m-4-4l4 4 4-4" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function EmptyTransactionsSvg({ size = 120, testID, accessibilityLabel }: BudgetSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...(testID ? { testID } : {})} {...(accessibilityLabel ? { accessibilityLabel } : {})}>
      <Rect width={120} height={120} rx={28} fill="#F4F6FA" />
      <Rect x={2} y={2} width={116} height={116} rx={26} stroke="#E4E8EF" strokeWidth={2} />
      <Rect x={34} y={28} width={52} height={68} rx={6} fill="#FFFFFF" stroke="#98A1B3" strokeWidth={2} />
      <Rect x={42} y={38} width={24} height={4} rx={2} fill="#C6CCD8" />
      <Circle cx={76} cy={40} r={3} fill="#C6CCD8" />
      <Rect x={42} y={48} width={28} height={4} rx={2} fill="#E4E8EF" />
      <Circle cx={76} cy={50} r={3} fill="#E4E8EF" />
      <Rect x={42} y={58} width={20} height={4} rx={2} fill="#E4E8EF" />
      <Circle cx={76} cy={60} r={3} fill="#E4E8EF" />
      <Circle cx={66} cy={72} r={14} fill="#FFFFFF" stroke="#12A184" strokeWidth={3} />
      <Path d="M76 82l12 12" stroke="#12A184" strokeWidth={4} strokeLinecap="round" />
      <Path d="M30 46l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z" fill="#3FBFA3" />
    </Svg>
  );
}

export function EmptyPotjesSvg({ size = 120, testID, accessibilityLabel }: BudgetSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...(testID ? { testID } : {})} {...(accessibilityLabel ? { accessibilityLabel } : {})}>
      <Rect width={120} height={120} rx={28} fill="#F4F6FA" />
      <Rect x={2} y={2} width={116} height={116} rx={26} stroke="#E4E8EF" strokeWidth={2} />
      <Rect x={42} y={34} width={36} height={6} rx={2} fill="#C6CCD8" stroke="#98A1B3" strokeWidth={1.5} />
      <Path d="M42 40h36c5 0 9 4 9 9v32c0 8-6 13-13 13H46c-7 0-13-5-13-13V49c0-5 4-9 9-9z" fill="#FFFFFF" stroke="#98A1B3" strokeWidth={2.5} />
      <Circle cx={60} cy={64} r={14} fill="#DFF4EE" stroke="#12A184" strokeWidth={2} />
      <Path d="M60 57v14M53 64h14" stroke="#0E7A63" strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M32 36l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z" fill="#E9AE3C" />
      <Path d="M88 42l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z" fill="#2E6FD1" />
    </Svg>
  );
}

export function SavingsGoalReachedSvg({ size = 120, testID, accessibilityLabel }: BudgetSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...(testID ? { testID } : {})} {...(accessibilityLabel ? { accessibilityLabel } : {})}>
      <Defs>
        <LinearGradient id="sgr-trophy-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E9AE3C" />
          <Stop offset="100%" stopColor="#C98A0E" />
        </LinearGradient>
      </Defs>
      <Rect width={120} height={120} rx={28} fill="#0E1116" />
      <Rect x={2} y={2} width={116} height={116} rx={26} stroke="#232833" strokeWidth={2} />
      <Circle cx={60} cy={56} r={38} fill="#C98A0E" fillOpacity={0.12} />
      <Path d="M42 34h36v22c0 10-8 18-18 18s-18-8-18-18V34z" fill="url(#sgr-trophy-rn)" stroke="#9A6300" strokeWidth={2.5} />
      <Path d="M42 40H34a6 6 0 0 0-6 6v4a6 6 0 0 0 6 6h8" stroke="#E9AE3C" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Path d="M78 40h8a6 6 0 0 1 6 6v4a6 6 0 0 1-6 6h-8" stroke="#E9AE3C" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Rect x={56} y={74} width={8} height={12} fill="#9A6300" />
      <Rect x={46} y={86} width={28} height={8} rx={3} fill="url(#sgr-trophy-rn)" stroke="#9A6300" strokeWidth={2} />
      <Polygon points="60,44 62,50 68,50 63,54 65,60 60,56 55,60 57,54 52,50 58,50" fill="#FFFFFF" />
      <Rect x={28} y={26} width={5} height={3} rx={1} fill="#3FBFA3" transform="rotate(24 28 26)" />
      <Rect x={88} y={24} width={5} height={3} rx={1} fill="#E0665C" transform="rotate(-30 88 24)" />
      <Rect x={92} y={68} width={4} height={4} rx={1} fill="#7ED8C3" transform="rotate(45 92 68)" />
      <Rect x={24} y={70} width={4} height={4} rx={1} fill="#E9AE3C" transform="rotate(15 24 70)" />
    </Svg>
  );
}

export function WarningOverbudgetSvg({ size = 120, testID, accessibilityLabel }: BudgetSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...(testID ? { testID } : {})} {...(accessibilityLabel ? { accessibilityLabel } : {})}>
      <Defs>
        <LinearGradient id="wob-bg-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FBEFD6" />
          <Stop offset="100%" stopColor="#FBE4E1" />
        </LinearGradient>
      </Defs>
      <Rect width={120} height={120} rx={28} fill="url(#wob-bg-rn)" />
      <Rect x={2} y={2} width={116} height={116} rx={26} stroke="#E9AE3C" strokeWidth={2} strokeOpacity={0.3} />
      <Path d="M55 27.5c2.2-3.8 7.8-3.8 10 0l35 60c2.2 3.8-.6 8.5-5 8.5H25c-4.4 0-7.2-4.7-5-8.5l35-60z" fill="#E9AE3C" stroke="#9A6300" strokeWidth={3} strokeLinejoin="round" />
      <Path d="M56.5 35c1.4-2.4 4.8-2.4 6.2 0l27 46.5c1.4 2.4-.3 5.5-3.1 5.5H33.4c-2.8 0-4.5-3.1-3.1-5.5l27-46.5z" fill="#FFFFFF" />
      <Rect x={57} y={47} width={6} height={20} rx={3} fill="#9A6300" />
      <Circle cx={60} cy={74} r={3.5} fill="#9A6300" />
    </Svg>
  );
}
