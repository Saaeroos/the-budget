// Shared by `BarChart`/`LineChart` — `docs/12` §6: "Axis money labels abbreviate as `€ 1,2k`
// only above €10.000; below that, full figures." A presentation-only formatting rule (like
// `<Money>` itself), not business meaning, so it is fine to live in `ui/`.
import { cents as toCents, formatEUR } from '@shared';

/* ── Text ─────────────────────────────────────────────── */
// A formatting glyph, not i18n copy — same convention as `packages/shared`'s own `SYMBOLS`.
const MINUS = '−';

/* ── Types ────────────────────────────────────────────── */

export type AxisValueFormat = 'money' | 'plain';

/* ── Implementation ───────────────────────────────────── */

const LIMITS = { abbreviateAboveCents: 1_000_000, centsPerThousandEuro: 100_000 } as const;

function formatMoneyAxisLabel(valueCents: number): string {
  const isNegative = valueCents < 0;
  const absolute = Math.abs(valueCents);
  const rendered =
    absolute < LIMITS.abbreviateAboveCents
      ? formatEUR(toCents(Math.round(absolute)), { decimals: 'auto' })
      : `€ ${(absolute / LIMITS.centsPerThousandEuro).toFixed(1).replace('.', ',')}k`;
  return isNegative ? `${MINUS}${rendered}` : rendered;
}

export function formatAxisValue(value: number, format: AxisValueFormat): string {
  return format === 'money' ? formatMoneyAxisLabel(value) : `${Math.round(value)}`;
}
