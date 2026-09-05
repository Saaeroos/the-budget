import Svg, { Circle, Defs, Ellipse, Line, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import type { BudgetSvgProps } from './types';

/* ── Types ────────────────────────────────────────────── */

export type { BudgetSvgProps } from './types';

/* ── Implementation ───────────────────────────────────── */

export function BucketVasteLastenSvg({ size = 120, testID, accessibilityLabel }: BudgetSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...(testID ? { testID } : {})} {...(accessibilityLabel ? { accessibilityLabel } : {})}>
      <Defs>
        <LinearGradient id="vl-bg-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E3EDFB" />
          <Stop offset="100%" stopColor="#C9DCF8" />
        </LinearGradient>
        <LinearGradient id="vl-roof-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#2E6FD1" />
          <Stop offset="100%" stopColor="#1B4FA0" />
        </LinearGradient>
      </Defs>
      <Rect width={120} height={120} rx={28} fill="url(#vl-bg-rn)" />
      <Rect x={2} y={2} width={116} height={116} rx={26} stroke="#2E6FD1" strokeWidth={2} strokeOpacity={0.2} />
      <Rect x={36} y={54} width={48} height={40} rx={6} fill="#FFFFFF" stroke="#1B4FA0" strokeWidth={2.5} />
      <Path d="M26 56L57.5 28.5c1.4-1.2 3.6-1.2 5 0L94 56" stroke="url(#vl-roof-rn)" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
      <Polygon points="60,35 38,54 82,54" fill="#2E6FD1" fillOpacity={0.15} />
      <Rect x={51} y={68} width={18} height={26} rx={4} fill="#E3EDFB" stroke="#2E6FD1" strokeWidth={2} />
      <Circle cx={60} cy={77} r={3} fill="#1B4FA0" />
      <Path d="M60 80v6" stroke="#1B4FA0" strokeWidth={2} strokeLinecap="round" />
      <Circle cx={84} cy={44} r={14} fill="#2E6FD1" stroke="#FFFFFF" strokeWidth={2.5} />
      <Path d="M78 44l4 4 8-8" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BucketReserveringenSvg({ size = 120, testID, accessibilityLabel }: BudgetSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...(testID ? { testID } : {})} {...(accessibilityLabel ? { accessibilityLabel } : {})}>
      <Defs>
        <LinearGradient id="res-bg-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#DFF4EE" />
          <Stop offset="100%" stopColor="#C3EBDD" />
        </LinearGradient>
        <LinearGradient id="res-jar-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
          <Stop offset="100%" stopColor="#7ED8C3" stopOpacity={0.2} />
        </LinearGradient>
      </Defs>
      <Rect width={120} height={120} rx={28} fill="url(#res-bg-rn)" />
      <Rect x={2} y={2} width={116} height={116} rx={26} stroke="#12A184" strokeWidth={2} strokeOpacity={0.2} />
      <Rect x={40} y={32} width={40} height={8} rx={3} fill="#0E7A63" />
      <Rect x={44} y={40} width={32} height={4} rx={1} fill="#0B5B4B" />
      <Path d="M40 44h40c6 0 10 4 10 10v30c0 8-6 14-14 14H44c-8 0-14-6-14-14V54c0-6 4-10 10-10z" fill="url(#res-jar-rn)" stroke="#0E7A63" strokeWidth={3} strokeLinejoin="round" />
      <Path d="M32 78c8-3 16 3 28 0s18-3 28 0v8c0 7-5 12-12 12H44c-7 0-12-5-12-12v-8z" fill="#12A184" fillOpacity={0.25} />
      <Circle cx={60} cy={24} r={12} fill="#12A184" stroke="#FFFFFF" strokeWidth={2} />
      <Path d="M63 21a5 5 0 0 0-6 3v1h6m-7 2h7m-7-2a5 5 0 0 0 6 3" stroke="#FFFFFF" strokeWidth={1.75} strokeLinecap="round" />
      <Ellipse cx={52} cy={86} rx={10} ry={5} fill="#3FBFA3" stroke="#0E7A63" strokeWidth={1.5} />
      <Ellipse cx={68} cy={84} rx={10} ry={5} fill="#12A184" stroke="#0B5B4B" strokeWidth={1.5} />
      <Ellipse cx={60} cy={80} rx={9} ry={4.5} fill="#7ED8C3" stroke="#0E7A63" strokeWidth={1.5} />
      <Path d="M84 48l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#0E7A63" opacity={0.7} />
    </Svg>
  );
}

export function BucketHuishoudelijkSvg({ size = 120, testID, accessibilityLabel }: BudgetSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...(testID ? { testID } : {})} {...(accessibilityLabel ? { accessibilityLabel } : {})}>
      <Defs>
        <LinearGradient id="hh-bg-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FBEFD6" />
          <Stop offset="100%" stopColor="#F7E1B5" />
        </LinearGradient>
        <LinearGradient id="hh-basket-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E9AE3C" />
          <Stop offset="100%" stopColor="#C98A0E" />
        </LinearGradient>
      </Defs>
      <Rect width={120} height={120} rx={28} fill="url(#hh-bg-rn)" />
      <Rect x={2} y={2} width={116} height={116} rx={26} stroke="#C98A0E" strokeWidth={2} strokeOpacity={0.2} />
      <Path d="M40 58V40a20 20 0 0 1 40 0v18" stroke="#9A6300" strokeWidth={3} strokeLinecap="round" />
      <Circle cx={48} cy={52} r={9} fill="#E0665C" stroke="#96271F" strokeWidth={1.5} />
      <Path d="M48 43c1-2 4-3 5-3" stroke="#0E7A63" strokeWidth={2} strokeLinecap="round" />
      <Rect x={64} y={32} width={10} height={28} rx={5} transform="rotate(18 64 32)" fill="#E9AE3C" stroke="#9A6300" strokeWidth={1.5} />
      <Line x1={67} y1={38} x2={72} y2={39} stroke="#9A6300" strokeWidth={1.2} />
      <Line x1={69} y1={44} x2={74} y2={45} stroke="#9A6300" strokeWidth={1.2} />
      <Rect x={54} y={42} width={14} height={20} rx={2} fill="#FFFFFF" stroke="#4A5365" strokeWidth={1.5} />
      <Rect x={58} y={38} width={6} height={4} rx={1} fill="#2E6FD1" />
      <Path d="M28 58h64l-8 34c-1 4-5 7-9 7H45c-4 0-8-3-9-7l-8-34z" fill="url(#hh-basket-rn)" stroke="#9A6300" strokeWidth={2.5} strokeLinejoin="round" />
      <Line x1={33} y1={68} x2={87} y2={68} stroke="#9A6300" strokeWidth={1.75} opacity={0.6} />
      <Line x1={37} y1={78} x2={83} y2={78} stroke="#9A6300" strokeWidth={1.75} opacity={0.6} />
      <Line x1={48} y1={59} x2={45} y2={98} stroke="#9A6300" strokeWidth={1.75} opacity={0.6} />
      <Line x1={60} y1={59} x2={60} y2={98} stroke="#9A6300" strokeWidth={1.75} opacity={0.6} />
      <Line x1={72} y1={59} x2={75} y2={98} stroke="#9A6300" strokeWidth={1.75} opacity={0.6} />
    </Svg>
  );
}

export function BucketVrijBesteedbaarSvg({ size = 120, testID, accessibilityLabel }: BudgetSvgProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none" {...(testID ? { testID } : {})} {...(accessibilityLabel ? { accessibilityLabel } : {})}>
      <Defs>
        <LinearGradient id="vb-bg-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E4E8EF" />
          <Stop offset="100%" stopColor="#C6CCD8" />
        </LinearGradient>
        <LinearGradient id="vb-wallet-rn" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#4A5365" />
          <Stop offset="100%" stopColor="#232833" />
        </LinearGradient>
      </Defs>
      <Rect width={120} height={120} rx={28} fill="url(#vb-bg-rn)" />
      <Rect x={2} y={2} width={116} height={116} rx={26} stroke="#6B7488" strokeWidth={2} strokeOpacity={0.2} />
      <Rect x={38} y={32} width={44} height={24} rx={4} transform="rotate(-6 38 32)" fill="#DFF4EE" stroke="#12A184" strokeWidth={2} />
      <Circle cx={59} cy={43} r={5} fill="#12A184" fillOpacity={0.3} />
      <Rect x={28} y={46} width={64} height={44} rx={10} fill="url(#vb-wallet-rn)" stroke="#0E1116" strokeWidth={2.5} />
      <Path d="M29 56h62" stroke="#6B7488" strokeWidth={1.5} strokeDasharray="3 2" />
      <Path d="M74 58h18c3 0 5 2 5 5v10c0 3-2 5-5 5H74z" fill="#333A48" stroke="#0E1116" strokeWidth={2} />
      <Circle cx={84} cy={68} r={4} fill="#E9AE3C" stroke="#9A6300" strokeWidth={1.5} />
      <Path d="M26 36l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#2E6FD1" />
      <Path d="M94 38l2.5 5 5 2.5-5 2.5-2.5 5-2.5-5-5-2.5 5-2.5z" fill="#12A184" />
    </Svg>
  );
}
