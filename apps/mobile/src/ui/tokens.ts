// Design tokens — the ONLY place a raw colour, spacing, radius, font size or shadow value
// may be written. Every other file in `src/ui/**` (and every feature file, per
// `.claude/rules/06-ui-and-styling.md`) reads values through `useTheme()` or `tokens`.
// Spec: docs/12-design-system.md §2–4, §7.
import type { TextStyle, ViewStyle } from 'react-native';

/* ── Types ────────────────────────────────────────────── */

export type ColorScheme = 'light' | 'dark';

/** The fixed Nibud four-bucket keys, plus the two non-budget category groups (`docs/06` §6). */
export type CategoryGroup =
  | 'vaste_lasten'
  | 'reserveringen'
  | 'huishoudelijk'
  | 'vrij_besteedbaar'
  | 'inkomen'
  | 'overboeking';

// Kebab-case, matching the token names in docs/12 §3 verbatim.
export type TypeVariant =
  | 'display-xl'
  | 'display'
  | 'title-lg'
  | 'title'
  | 'body-lg'
  | 'body'
  | 'label'
  | 'mono';

export interface TypeToken {
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly fontWeight: NonNullable<TextStyle['fontWeight']>;
  readonly fontFamily?: string;
  readonly fontVariant?: NonNullable<TextStyle['fontVariant']>;
}

export interface ThemeColors {
  readonly bgCanvas: string;
  readonly bgSurface: string;
  readonly bgSurfaceRaised: string;
  readonly bgSubtle: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textTertiary: string;
  readonly textInverse: string;
  readonly borderSubtle: string;
  readonly borderStrong: string;
  readonly accentBg: string;
  readonly accentFg: string;
  readonly accentSoft: string;
  readonly statusWarn: string;
  readonly statusDanger: string;
  readonly statusInfo: string;
  readonly statusPositive: string;
}

export interface ThemeElevation {
  readonly card: ViewStyle;
  readonly raised: ViewStyle;
}

/** Fully resolved tokens for one colour scheme. Components read only from this. */
export interface Theme {
  readonly scheme: ColorScheme;
  readonly colors: ThemeColors;
  readonly bucketColor: Readonly<Record<CategoryGroup, string>>;
  readonly type: Readonly<Record<TypeVariant, TypeToken>>;
  readonly typeScaleCap: Readonly<Partial<Record<TypeVariant, number>>>;
  readonly spacing: typeof spacing;
  readonly radius: typeof radius;
  readonly elevation: ThemeElevation;
  readonly icon: typeof icon;
}

/* ── Palette (raw — never referenced outside this file) ── */

export const palette = {
  ink: {
    900: '#121815',
    800: '#1A231F',
    700: '#26332E',
    600: '#374741',
    500: '#4D5E56',
    400: '#72857C',
    300: '#9FB0A8',
    200: '#CFDAD4',
    100: '#E3ECE7',
    50: '#F7F9F7',
  },
  accent: { 700: '#1B5244', 600: '#236655', 500: '#2D7A66', 400: '#4EBA9C', 300: '#82D4BC', 100: '#E5F2EC' },
  amber: { 600: '#8C5609', 500: '#B57314', 400: '#D9922B', 100: '#FDF5EA' },
  red: { 600: '#8F2B22', 500: '#BA3F34', 400: '#DC6458', 100: '#FCEFEB' },
  blue: { 600: '#1B4D8A', 500: '#2C6CB5', 100: '#E6EFFB' },
  white: '#FFFFFF',
} as const;

/* ── Bucket colours — fixed, never reassigned, identical in both themes (`docs/12` §2) ── */

export const bucketColor: Readonly<Record<CategoryGroup, string>> = {
  vaste_lasten: palette.blue[500],
  reserveringen: palette.accent[500],
  huishoudelijk: palette.amber[500],
  vrij_besteedbaar: palette.ink[400],
  // Not in the spec's fixed four — income and internal transfers are outside the
  // spend-bucket model (`docs/10`), but `CategoryChip` still needs a dot for them.
  inkomen: palette.accent[600],
  overboeking: palette.ink[300],
};

/* ── Semantic colour tokens per scheme (`docs/12` §2) ── */

const lightColors: ThemeColors = {
  bgCanvas: palette.ink[50],
  bgSurface: palette.white,
  bgSurfaceRaised: palette.white,
  bgSubtle: '#EDF3F0',
  textPrimary: palette.ink[900],
  textSecondary: palette.ink[500],
  textTertiary: palette.ink[400],
  textInverse: palette.white,
  borderSubtle: palette.ink[100],
  borderStrong: palette.ink[200],
  accentBg: palette.accent[500],
  accentFg: palette.white,
  accentSoft: palette.accent[100],
  statusWarn: palette.amber[500],
  statusDanger: palette.red[500],
  statusInfo: palette.blue[500],
  statusPositive: palette.accent[600],
};

const darkColors: ThemeColors = {
  bgCanvas: palette.ink[900],
  bgSurface: palette.ink[800],
  bgSurfaceRaised: palette.ink[700],
  bgSubtle: palette.ink[700],
  textPrimary: palette.ink[50],
  textSecondary: palette.ink[300],
  textTertiary: palette.ink[400],
  textInverse: palette.ink[900],
  borderSubtle: palette.ink[700],
  borderStrong: palette.ink[600],
  accentBg: palette.accent[400],
  accentFg: palette.ink[900],
  accentSoft: palette.accent[700],
  statusWarn: palette.amber[400],
  statusDanger: palette.red[400],
  statusInfo: palette.blue[500],
  statusPositive: palette.accent[400],
};

/* ── Typography (`docs/12` §3) ── */
// RN's `fontWeight` only accepts multiples of 100 — the spec's 650/550 are rounded to the
// nearest supported step (docs/DECISIONS.md, 2026-09-03 — type-scale font-weight rounding).

export const typeScale: Readonly<Record<TypeVariant, TypeToken>> = {
  'display-xl': { fontSize: 44, lineHeight: 48, fontWeight: '700', fontVariant: ['tabular-nums'] },
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700', fontVariant: ['tabular-nums'] },
  'title-lg': { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  title: { fontSize: 19, lineHeight: 25, fontWeight: '600' },
  'body-lg': { fontSize: 17, lineHeight: 24, fontWeight: '400' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  mono: { fontSize: 13, lineHeight: 18, fontWeight: '400', fontFamily: 'monospace' },
};

/** Dynamic-type cap: `display-xl` stops scaling past 1.6× and reflows to two lines instead. */
export const typeScaleCap: Readonly<Partial<Record<TypeVariant, number>>> = {
  'display-xl': 1.6,
};

/* ── Spacing, radius (`docs/12` §4) ── */

export const spacing = {
  '2': 2,
  '4': 4,
  '8': 8,
  '12': 12,
  '16': 16,
  '20': 20,
  '24': 24,
  '32': 32,
  '40': 40,
  '56': 56,
  '72': 72,
  gutter: 16,
  cardPadding: 16,
  sectionGap: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

/* ── Elevation (`docs/12` §4) — dark mode swaps shadow for a lighter surface ── */

const lightElevation: ThemeElevation = {
  card: {
    backgroundColor: lightColors.bgSurface,
    borderWidth: 1,
    borderColor: lightColors.borderSubtle,
    shadowColor: palette.ink[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  raised: {
    backgroundColor: lightColors.bgSurfaceRaised,
    shadowColor: palette.ink[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};

const darkElevation: ThemeElevation = {
  card: {
    backgroundColor: darkColors.bgSurface,
    borderWidth: 1,
    borderColor: darkColors.borderSubtle,
  },
  raised: {
    backgroundColor: darkColors.bgSurfaceRaised,
  },
};

/* ── Iconography (`docs/12` §7) ── */

export const icon = {
  strokeWidth: 1.75,
  sizeInline: 20,
  sizeNav: 24,
} as const;

/* ── Resolution ───────────────────────────────────────── */

const themes: Readonly<Record<ColorScheme, Theme>> = {
  light: {
    scheme: 'light',
    colors: lightColors,
    bucketColor,
    type: typeScale,
    typeScaleCap,
    spacing,
    radius,
    elevation: lightElevation,
    icon,
  },
  dark: {
    scheme: 'dark',
    colors: darkColors,
    bucketColor,
    type: typeScale,
    typeScaleCap,
    spacing,
    radius,
    elevation: darkElevation,
    icon,
  },
};

/** Returns the fully-resolved token set for a scheme. Used by `ThemeProvider` only. */
export function resolveTheme(scheme: ColorScheme): Theme {
  return themes[scheme];
}

/** Static token definitions, for the rare consumer that needs raw values outside a component
 * (e.g. a non-React module). Components should prefer `useTheme()`. */
export const tokens = {
  palette,
  bucketColor,
  typeScale,
  typeScaleCap,
  spacing,
  radius,
  icon,
  light: themes.light,
  dark: themes.dark,
} as const;
