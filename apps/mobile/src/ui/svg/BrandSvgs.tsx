import Svg, { Circle, Defs, G, LinearGradient, Path, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';
import type { BudgetSvgProps } from './types';

/* ── Types ────────────────────────────────────────────── */

export type { BudgetSvgProps } from './types';

/* ── Implementation ───────────────────────────────────── */

export function KwartjeMarkSvg({ size = 120, testID, accessibilityLabel }: BudgetSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...(testID ? { testID } : {})} {...(accessibilityLabel ? { accessibilityLabel } : {})}>
      <Defs>
        <LinearGradient id="km-grad-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#12A184" />
          <Stop offset="100%" stopColor="#0B5B4B" />
        </LinearGradient>
        <LinearGradient id="km-sheen-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#7ED8C3" stopOpacity={0.6} />
          <Stop offset="100%" stopColor="#12A184" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect width={120} height={120} rx={28} fill="#0E1116" />
      <Rect x={2} y={2} width={116} height={116} rx={26} stroke="#232833" strokeWidth={2} />
      <Circle cx={60} cy={56} r={42} fill="#0E7A63" fillOpacity={0.12} />
      <Rect x={28} y={78} width={64} height={10} rx={5} fill="#171B22" stroke="#333A48" strokeWidth={1.5} />
      <Rect x={34} y={81} width={52} height={4} rx={2} fill="#0E1116" />
      <G transform="translate(60, 52) rotate(20) translate(-60, -52)">
        <Circle cx={60} cy={52} r={32} fill="url(#km-grad-rn)" stroke="#7ED8C3" strokeWidth={2.5} />
        <Circle cx={60} cy={52} r={28} fill="#0E7A63" />
        <Circle cx={60} cy={52} r={25} stroke="#3FBFA3" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7} />
        <Path d="M38 34c7-8 16-11 25-10" stroke="url(#km-sheen-rn)" strokeWidth={3} strokeLinecap="round" />
        <Path d="M48 36h6v32h-6z" fill="#0E1116" />
        <Path d="M54 53l12-17h7L59 52l15 16h-8L54 52z" fill="#0E1116" />
      </G>
    </Svg>
  );
}

export function SafeToSpendSvg({ size = 120, testID, accessibilityLabel }: BudgetSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...(testID ? { testID } : {})} {...(accessibilityLabel ? { accessibilityLabel } : {})}>
      <Defs>
        <LinearGradient id="sts-glow-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#12A184" />
          <Stop offset="100%" stopColor="#0E7A63" />
        </LinearGradient>
        <LinearGradient id="sts-shield-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#DFF4EE" />
        </LinearGradient>
      </Defs>
      <Rect width={120} height={120} rx={28} fill="#0E1116" />
      <Rect x={2} y={2} width={116} height={116} rx={26} stroke="#232833" strokeWidth={2} />
      <Circle cx={60} cy={60} r={46} stroke="#12A184" strokeWidth={2} strokeDasharray="4 3" opacity={0.4} />
      <Circle cx={60} cy={60} r={40} fill="#0E7A63" fillOpacity={0.15} />
      <Path d="M60 26l26 10v20c0 18-11 31-26 36-15-5-26-18-26-36V36l26-10z" fill="url(#sts-shield-rn)" stroke="#12A184" strokeWidth={3} strokeLinejoin="round" />
      <Path d="M60 33l19 7v16c0 13-8 23-19 27-11-4-19-14-19-27V40l19-7z" fill="#12A184" fillOpacity={0.15} />
      <Circle cx={60} cy={58} r={15} fill="url(#sts-glow-rn)" stroke="#FFFFFF" strokeWidth={2} />
      <Path d="M54 58l4 4 9-9" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BankConnectSvg({ size = 120, testID, accessibilityLabel }: BudgetSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...(testID ? { testID } : {})} {...(accessibilityLabel ? { accessibilityLabel } : {})}>
      <Defs>
        <LinearGradient id="bc-bg-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E3EDFB" />
          <Stop offset="100%" stopColor="#DFF4EE" />
        </LinearGradient>
      </Defs>
      <Rect width={120} height={120} rx={28} fill="url(#bc-bg-rn)" />
      <Rect x={2} y={2} width={116} height={116} rx={26} stroke="#2E6FD1" strokeWidth={2} strokeOpacity={0.2} />
      <Polygon points="60,25 28,42 92,42" fill="#2E6FD1" stroke="#1B4FA0" strokeWidth={2.5} strokeLinejoin="round" />
      <Rect x={26} y={42} width={68} height={6} rx={2} fill="#1B4FA0" />
      <Rect x={32} y={48} width={8} height={30} rx={2} fill="#FFFFFF" stroke="#1B4FA0" strokeWidth={2} />
      <Rect x={48} y={48} width={8} height={30} rx={2} fill="#FFFFFF" stroke="#1B4FA0" strokeWidth={2} />
      <Rect x={64} y={48} width={8} height={30} rx={2} fill="#FFFFFF" stroke="#1B4FA0" strokeWidth={2} />
      <Rect x={80} y={48} width={8} height={30} rx={2} fill="#FFFFFF" stroke="#1B4FA0" strokeWidth={2} />
      <Rect x={22} y={78} width={76} height={6} rx={2} fill="#1B4FA0" />
      <Rect x={18} y={84} width={84} height={8} rx={2} fill="#2E6FD1" />
      <Circle cx={60} cy={63} r={16} fill="#12A184" stroke="#FFFFFF" strokeWidth={2.5} />
      <Path d="M56 61v-3a4 4 0 0 1 8 0v3" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
      <Rect x={53} y={61} width={14} height={10} rx={2} fill="#FFFFFF" />
      <Circle cx={60} cy={66} r={1.5} fill="#0E7A63" />
    </Svg>
  );
}

export function IncomeSalarisSvg({ size = 120, testID, accessibilityLabel }: BudgetSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...(testID ? { testID } : {})} {...(accessibilityLabel ? { accessibilityLabel } : {})}>
      <Defs>
        <LinearGradient id="is-bg-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#DFF4EE" />
          <Stop offset="100%" stopColor="#E3EDFB" />
        </LinearGradient>
      </Defs>
      <Rect width={120} height={120} rx={28} fill="url(#is-bg-rn)" />
      <Rect x={2} y={2} width={116} height={116} rx={26} stroke="#12A184" strokeWidth={2} strokeOpacity={0.2} />
      <Rect x={28} y={32} width={64} height={62} rx={8} fill="#FFFFFF" stroke="#0E7A63" strokeWidth={2.5} />
      <Path d="M28 40c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v8H28v-8z" fill="#12A184" stroke="#12A184" strokeWidth={2.5} />
      <Rect x={42} y={26} width={5} height={10} rx={2.5} fill="#0E7A63" />
      <Rect x={73} y={26} width={5} height={10} rx={2.5} fill="#0E7A63" />
      <SvgText x={60} y={72} fontFamily="sans-serif" fontSize={24} fontWeight="bold" fill="#0E7A63" textAnchor="middle">
        24
      </SvgText>
      <SvgText x={60} y={84} fontFamily="sans-serif" fontSize={10} fontWeight="600" fill="#3FBFA3" textAnchor="middle">
        SALARIS
      </SvgText>
      <Circle cx={86} cy={34} r={13} fill="#12A184" stroke="#FFFFFF" strokeWidth={2.5} />
      <Path d="M81 37l4-4 4 4m-4-4v9" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
