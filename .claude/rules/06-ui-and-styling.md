# Rule 06 — UI, styling and components

## Tokens only

Every colour, spacing, radius, font size and shadow comes from `src/ui/tokens.ts`. A literal `#hex`, a literal `padding: 12`, a literal `fontSize: 15` anywhere outside that file is a lint error.

```tsx
// ✗
<View style={{ padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12 }} />

// ✓
<Card />                                    // Card already encodes the tokens
<View style={styles.row} />                 // styles built from tokens
```

## Component rules

- `src/ui/**` components are **dumb**: no queries, no stores, no i18n lookups of domain copy, no knowledge of what money *means*. They take props and render.
- Feature components may use i18n and view models, but not queries. Screens own the queries.
- Every interactive element takes `accessibilityLabel` (from a `TEXT` key) and `testID` (from a `TEST_ID` const).
- Props objects are `readonly` and typed as `<Component>Props`, exported.
- No component takes more than 3 primitive props before you switch to a single typed object.
- No `React.FC`. Function declarations with a destructured typed parameter.
- No inline arrow props on list rows — they break memoisation. Bind the id and use a stable `onPress` from the parent via `useCallback` on the row itself.

## Styles

- `StyleSheet.create` at the bottom of the file, built from tokens. No inline style objects except for a single dynamic value (`style={[styles.bar, { width }]}`).
- Theming happens through `useTheme()` returning resolved tokens. Components never branch on `useColorScheme()` themselves.
- No `Dimensions.get('window')` at module scope — use `useWindowDimensions()`.
- Safe area via `useSafeAreaInsets()`, never hardcoded padding.

## Text

- `<Text>` from `src/ui`, never React Native's directly. It enforces the type scale, the colour tokens and the font-scaling behaviour.
- Money always through `<Money cents={…} />`, never a formatted string in a `<Text>`.
- Everything renders correctly at 200% font scale. Test it.

## Lists

- `FlashList` for anything over 50 rows, with a correct `estimatedItemSize`.
- Row components are `memo`'d with primitive or stable props.
- `keyExtractor` returns a stable id, never an index.
- Every list has: loading skeleton, empty state, error state, and a footer for pagination.

## Forms

- `react-hook-form` + a zod resolver from `packages/shared/contracts/`.
- Validation messages are i18n keys resolved at render.
- Never validate in the component body.

## Animation

- `react-native-reanimated` only. No `Animated` from React Native.
- Anything on the UI thread is a worklet. No `setState` in a scroll handler.
- Respect reduced motion: `useReducedMotion()` disables count-ups and springs.
- No animation longer than 300ms in a utility flow.

## Accessibility (blocking, not optional)

- ≥44×44 touch targets.
- Meaning never carried by colour alone.
- Reading order matches visual order.
- Money read as speech (`formatMoneyForSpeech`), not as symbols.
- Charts expose a one-sentence `accessibilityLabel` summary.
