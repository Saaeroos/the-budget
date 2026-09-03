# Rule 07 — Testing

Full strategy is in `docs/19`. These are the rules you follow while writing code.

## What must have a test, always

| Code | Test |
|---|---|
| Anything in `logic/` or `packages/shared/` | Unit test, **100% branch coverage**, no mocks |
| Any formatter (money, date, speech) | Table-driven test with the exact expected strings |
| Any parser (descriptor, CSV, MT940) | Fixture test with a real-shaped input |
| Any zod contract | Round-trip parse test, including a rejection case |
| Any new table or policy | pgTAP test proving cross-tenant isolation |
| Any mutation | Optimistic-update + rollback test |
| Any screen | At least: renders empty, renders data, renders error |

## How to write them

- **Arrange, act, assert.** One behaviour per test. The test name is a sentence: `returns zero contribution when the target is already reached`.
- **No mocks in `logic/`.** If a function needs a mock, it has a dependency that should be a parameter (`04-solid.md`, D).
- **Deterministic.** `today` is passed in. No `new Date()`, no `Math.random()`, no network, no timers unless faked.
- **Test values, not snapshots.** Snapshot tests of component trees are banned; they assert nothing and break on every refactor. Snapshot tests of *formatted output strings* are fine.
- **Fixtures are committed and synthetic.** Never a real bank export.
- **Test the edge cases the spec names.** `docs/10` §11 and `docs/06` §11 are literal test checklists — every row must exist as a test.

## Money and date tests

Every money test asserts the exact Dutch string:
```ts
expect(formatEUR(cents(123456))).toBe('€ 1.234,56');
expect(formatEUR(cents(-4200))).toBe('−€ 42,00');   // U+2212
expect(formatMoneyForSpeech(cents(41250))).toBe('412 euro en 50 cent');
```

Every period test covers: month with 28/29/30/31 days, an anchor day of 28 in February, a DST boundary, and a period-kind change mid-period.

## Component tests

```tsx
it('shows the behind status when the envelope is behind', () => {
  render(<EnvelopeCard envelope={fixtures.behind} status="behind" onPress={jest.fn()} />);
  expect(screen.getByTestId(TEST_ID.card)).toBeOnTheScreen();
  expect(screen.getByText('€ 84 achter')).toBeOnTheScreen();
});
```
Query by accessible role or text, not by internal structure. If a test needs `testID` to find something a user would find by label, the component has an accessibility problem.

## What not to test

- Third-party library behaviour.
- Trivial pass-through components.
- Exact pixel layout.
- The React Compiler's memoisation.

## Before every commit

`pnpm check` — typecheck, lint, knip, unit tests, line-length check. CI runs the same thing plus pgTAP, edge tests, the categorisation accuracy gate and the bundle-size budget.
