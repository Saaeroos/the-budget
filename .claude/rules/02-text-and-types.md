# Rule 02 — TEXT objects, types and interfaces

## The rule

> **Every file that contains any human-readable string or any domain type declares, at the very top, immediately after its imports: first its `TEXT` object, then its types and interfaces. No string literal may appear anywhere else in the file. Not in JSX, not in a log, not in a throw, not in an accessibility label, not in a test id.**

This is enforced by `eslint-plugin-i18next/no-literal-string` and a custom rule, and by `pnpm i18n:check`.

## File template

```tsx
// features/potjes/components/EnvelopeCard.tsx
import { useTranslation } from 'react-i18next';
import { Card, Text, ProgressRing } from '@/ui';
import type { Envelope } from '../types';

/* ── Text ─────────────────────────────────────────────── */
const TEXT = {
  onTrack: 'potjes.on_track',
  behind: 'potjes.behind',
  done: 'potjes.done',
  perMonth: 'potjes.per_month',
  a11yCard: 'potjes.a11y.card',
} as const;

const TEST_ID = {
  card: 'envelope-card',
  ring: 'envelope-card-ring',
} as const;

/* ── Types ────────────────────────────────────────────── */
export type EnvelopeStatus = 'on_track' | 'behind' | 'done';

export interface EnvelopeCardProps {
  readonly envelope: Envelope;
  readonly status: EnvelopeStatus;
  readonly onPress: (id: string) => void;
}

/* ── Component ────────────────────────────────────────── */
export function EnvelopeCard({ envelope, status, onPress }: EnvelopeCardProps) {
  const { t } = useTranslation();
  ...
}
```

Rules that follow from this:
- `TEXT` values are **i18n keys**, never the Dutch text itself. The Dutch lives in `src/i18n/nl.json` (`docs/15` §3).
- `TEXT` is `as const` so keys are literal types.
- `TEST_ID` gets the same treatment — no literal test ids either.
- Non-UI files (edge functions, logic, scripts) also declare `TEXT` for any log message, error message or CLI output. Their values may be plain strings, since they are never shown to a user.
- A file with no strings simply has no `TEXT` block. Do not add an empty one.

## Why keys and not text

Because the app ships in `nl-NL` and `en-GB`, because copy changes without code changes, and because `pnpm i18n:check` can then prove that every key exists in every locale and that no key is orphaned.

## Types and interfaces

- **All types for a file live at the top**, after `TEXT`, in a clearly marked section. Never scattered between functions.
- `interface` for object shapes that are part of a public contract (props, entities, adapter contracts). `type` for unions, intersections, mapped types, function types.
- **No `I` prefix**, no `T` prefix. `Envelope`, not `IEnvelope`.
- Props types are always named `<Component>Props` and always `export`ed.
- Mark props `readonly`. Prefer `readonly T[]` over `T[]` for inputs.
- **No `any`.** Use `unknown` and narrow with zod. `// eslint-disable` for `any` is banned; if you need it, you need a zod schema instead.
- **No enums.** Use `as const` objects plus a derived union:
  ```ts
  export const BUCKET = {
    fixed: 'vaste_lasten',
    reserved: 'reserveringen',
    household: 'huishoudelijk',
    free: 'vrij_besteedbaar',
  } as const;
  export type Bucket = (typeof BUCKET)[keyof typeof BUCKET];
  ```
- Branded primitives for anything that must not be mixed up:
  ```ts
  export type Cents = number & { readonly __brand: 'Cents' };
  export type NLDate = string & { readonly __brand: 'NLDate' };   // 'YYYY-MM-DD'
  export type HouseholdId = string & { readonly __brand: 'HouseholdId' };
  ```
- Shared contracts (anything crossing the app ↔ edge-function boundary) are **zod schemas in `packages/shared/contracts/`**, with types derived via `z.infer`. Never hand-write a type for a payload that has a schema.

## Magic values

The string rule extends to numbers. Any number whose meaning is not self-evident goes in a named const at the top:

```ts
const LIMITS = {
  reviewConfidenceThreshold: 0.7,
  consentWarningDays: 14,
  maxRulesFreeTier: 5,
  defaultBufferCents: 10_000 as Cents,
} as const;
```

`0`, `1`, `-1`, `2` in obvious arithmetic are fine. `0.08`, `385`, `90`, `4.5` are not.
