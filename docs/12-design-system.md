# 12 — Design system

Implemented in `apps/mobile/src/ui/`. Tokens are the only source of style values; no literal colours, spacings or font sizes in feature code.

---

## 1. Brand

- **Name**: Kwartje. **Mark**: a coin at 20° entering a slot; the negative space forms a "k".
- **Feel**: nuchter, precise, warm-but-not-cute. Think Dutch graphic design tradition — grid, generous whitespace, strong type, one accent colour — not fintech gradients.
- App icon: dark ink background, coin in accent. No gradient, no glow.

## 2. Colour tokens

Semantic only. Never reference a raw palette value in a component.

```ts
export const palette = {
  ink:    { 900:'#0E1116', 800:'#171B22', 700:'#232833', 600:'#333A48', 500:'#4A5365', 400:'#6B7488', 300:'#98A1B3', 200:'#C6CCD8', 100:'#E4E8EF', 50:'#F4F6FA' },
  accent: { 700:'#0B5B4B', 600:'#0E7A63', 500:'#12A184', 400:'#3FBFA3', 300:'#7ED8C3', 100:'#DFF4EE' },  // muntgroen
  amber:  { 600:'#9A6300', 500:'#C98A0E', 400:'#E9AE3C', 100:'#FBEFD6' },
  red:    { 600:'#96271F', 500:'#C13B31', 400:'#E0665C', 100:'#FBE4E1' },
  blue:   { 600:'#1B4FA0', 500:'#2E6FD1', 100:'#E3EDFB' },
  white:'#FFFFFF',
} as const;
```

| Semantic token | Light | Dark | Used for |
|---|---|---|---|
| `bg.canvas` | `ink.50` | `ink.900` | screen background |
| `bg.surface` | `white` | `ink.800` | cards |
| `bg.surfaceRaised` | `white` | `ink.700` | sheets, menus |
| `bg.subtle` | `ink.100` | `ink.700` | chips, inputs |
| `text.primary` | `ink.900` | `ink.50` | |
| `text.secondary` | `ink.500` | `ink.300` | |
| `text.tertiary` | `ink.400` | `ink.400` | |
| `text.inverse` | `white` | `ink.900` | |
| `border.subtle` | `ink.100` | `ink.700` | |
| `border.strong` | `ink.200` | `ink.600` | |
| `accent.bg` | `accent.500` | `accent.400` | primary buttons |
| `accent.fg` | `white` | `ink.900` | on accent |
| `accent.soft` | `accent.100` | `accent.700` | tints |
| `status.warn` | `amber.500` | `amber.400` | over budget, expiring consent |
| `status.danger` | `red.500` | `red.400` | shortfall, errors |
| `status.info` | `blue.500` | `blue.500` | neutral info |
| `status.positive` | `accent.600` | `accent.400` | income, on track |

**Bucket colours are fixed and never reassigned**:
`vaste_lasten` → `blue.500` · `reserveringen` → `accent.500` · `huishoudelijk` → `amber.500` · `vrij_besteedbaar` → `ink.400`.

Rules: every text/background pair ≥ **4.5:1** (≥3:1 for ≥24px). Never encode meaning in colour alone — always pair with an icon, label or pattern. Over-budget is **amber**, not red; red is reserved for "you will actually run out of money".

## 3. Typography

System font stack (SF Pro / Roboto) — no custom font download, for performance and because Dutch text needs no special glyphs.

| Token | Size / line | Weight | Use |
|---|---|---|---|
| `display-xl` | 44 / 48 | 700, tabular | safe-to-spend hero |
| `display` | 32 / 38 | 700, tabular | section totals |
| `title-lg` | 24 / 30 | 650 | screen titles |
| `title` | 19 / 25 | 600 | card titles |
| `body-lg` | 17 / 24 | 400 | primary reading |
| `body` | 15 / 21 | 400 | default |
| `label` | 13 / 18 | 550 | chips, captions |
| `mono` | 13 / 18 | 400, monospace | raw bank descriptions, IBANs |

- **All money uses tabular figures** (`fontVariant: ['tabular-nums']`). Non-negotiable — columns must align.
- Dynamic type: every token scales with `PixelRatio.getFontScale()`, capped at 1.6× for `display-xl` (which reflows to two lines) and uncapped for body text. Test at 200%.

## 4. Spacing, radius, elevation

- Space scale (px): `2 4 8 12 16 20 24 32 40 56 72`. Screen gutter `16`. Card padding `16`. Section gap `24`.
- Radius: `sm 8` · `md 12` · `lg 16` · `xl 24` · `full 999`. Cards `lg`, buttons `md`, chips `full`.
- Elevation: only two levels. `card` = 1px `border.subtle` + shadow `0 1 2 rgba(0,0,0,.04)`; `raised` = shadow `0 8 24 rgba(0,0,0,.12)`. In dark mode elevation is expressed as a lighter surface, not a shadow.
- Min touch target 44×44 everywhere, including chips and list chevrons.

## 5. Core components (`src/ui/`)

| Component | Notes |
|---|---|
| `Text` | Wraps RN Text, takes `variant` token, `color` token. **The only way to render text.** |
| `Money` | `<Money cents={} variant sign="auto"|"always"|"none" />` — handles tabular nums, locale format, colour by direction |
| `Button` | `variant: primary \| secondary \| ghost \| danger`, `size: md \| lg`, loading state, full-width option |
| `Card` | padding, optional header/footer slots, press state |
| `ListRow` | leading (icon/logo/avatar), title, subtitle, trailing (money/chevron/switch), swipe actions |
| `CategoryChip` | icon + name + bucket colour dot |
| `ProgressBar` | value/max, over-fill in amber with a distinct hatch pattern |
| `ProgressRing` | for potjes, animated, respects reduced motion |
| `AmountInput` | numeric pad, `,` decimal, max 2 decimals, live € formatting, never allows a leading `-` |
| `Sheet` | `@gorhom/bottom-sheet` wrapper with standard header/handle/safe area |
| `SegmentedControl` | period/type switches |
| `EmptyState` | icon, title, body, primary action — required on every list |
| `Banner` | `info \| warn \| danger`, dismissible or persistent, used for consent/stale/offline |
| `Skeleton` | shimmer blocks matching real layout metrics |
| `DonutChart`, `BarChart`, `LineChart`, `Sparkline` | victory-native wrappers with locked axis/format conventions |

Component rules:
- `src/ui/*` never imports from `src/features/*` and never knows what money *means* — only how to render it.
- Every interactive component takes `accessibilityLabel` and `testID`.
- No component reads from a store or a query.

## 6. Charts

- Max 4 series. Bucket charts always use the fixed bucket colours in the fixed order.
- Axis money labels abbreviate as `€ 1,2k` only above €10.000; below that, full figures.
- Every chart has a text alternative for screen readers (`accessibilityLabel` summarising the data in one sentence) and a data table available on long-press.
- No pie charts other than the single bucket donut. No 3D, no gradients under lines, no animation on data change beyond 200ms.
- Grid lines `border.subtle`, 1px; no vertical grid on time series.

## 7. Iconography

`lucide-react-native`, stroke 1.75, size 20 (inline) / 24 (nav). Category icons are a fixed mapping in `src/ui/icons/categories.ts` — one icon per system category key, never randomised.

## 8. Writing in the UI

See `docs/15` for the full string table. Design-level rules:
- Sentence case for everything, including buttons (`Bank koppelen`, not `Bank Koppelen`).
- Buttons are verbs. `Opslaan`, `Koppelen`, `Verwijderen` — never `OK`.
- Errors: what happened + what to do. Never a code, never "Oops".
- Numbers in copy are always formatted by the same formatter as the UI (`€ 1.234,56`).

## 9. Dark mode

Full parity, no exceptions. Implemented via a `ThemeProvider` reading `useColorScheme()` plus a manual override in settings (`systeem` / `licht` / `donker`). All tokens resolve at the provider; components never branch on scheme themselves.

## 10. Accessibility checklist (per screen)

- [ ] All text scales to 200% without clipping or truncation of meaning
- [ ] VoiceOver/TalkBack reading order is logical; money is read as "412 euro", not "€412"
- [ ] All interactive elements ≥44pt with a label
- [ ] Contrast verified in both themes
- [ ] No meaning conveyed by colour alone
- [ ] Reduced motion honoured
- [ ] Focus visible when using an external keyboard
