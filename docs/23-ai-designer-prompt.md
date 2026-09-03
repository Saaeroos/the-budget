# 23 — Prompt for the AI design agent

Paste the block below into a design-capable AI (Claude Design canvas, v0, Figma AI, Midjourney for moodboards, etc.). It is written to be self-contained: the designer does not need to read the other specs.

Deliverables from the designer feed straight into `docs/12` (tokens) and `docs/11` (screens). Anything the designer invents that contradicts those files must be reconciled in `DECISIONS.md` before it is built.

---

## A. The master prompt (copy from here)

> You are designing **Kwartje**, a mobile budgeting app for the Dutch market. Deliver a complete, production-ready UI design system and screen set for iOS and Android, built with React Native.
>
> **What the app is.** Kwartje is a *huishoudboekje* — a household ledger. It connects to Dutch banks (ING, Rabobank, ABN AMRO, bunq, SNS) read-only, sorts every transaction into four fixed buckets that Dutch households already think in — **Vaste lasten** (fixed costs), **Reserveringen** (money set aside for bills that come later), **Huishoudelijke uitgaven** (day-to-day), **Vrij besteedbaar** (free) — and answers one question above all others: **"Hoeveel kan ik veilig uitgeven?"**
>
> **Who it is for.** Sanne, 29, Utrecht. Salary on the 24th. Uses Tikkie for everything. Fine until the 18th of the month, then not fine. Also Bram & Fleur, 36, two incomes, one mortgage, a kid, a car, and an energy bill that surprises them every spring. And Ria, 61, who needs 200% text and no jargon. Design for all three without three apps.
>
> **Design direction.** Dutch graphic design tradition, not Silicon Valley fintech. Grid discipline, generous whitespace, confident typography, one accent colour. Nuchter — level-headed, precise, warm but never cute. No gradients, no glassmorphism, no glow, no 3D coins, no confetti, no mascots, no gamification. The app should feel like a well-designed Dutch bank statement that someone actually cared about: calm, legible, trustworthy, slightly dry.
>
> **Colour.** Ink neutrals from near-black `#0E1116` to `#F4F6FA`. One accent: muntgroen `#12A184` (light) / `#3FBFA3` (dark). Amber `#C98A0E` for "over budget". Red `#C13B31` reserved *only* for "you will actually run out of money" — never for going over a category budget. Four fixed bucket colours that never change meaning: Vaste lasten blue `#2E6FD1`, Reserveringen green `#12A184`, Huishoudelijk amber `#C98A0E`, Vrij besteedbaar grey `#6B7488`. Full light and dark themes, both first-class. Every text/background pair at least 4.5:1.
>
> **Typography.** System stack (SF Pro / Roboto). All money uses **tabular figures** — columns must align. Scale: display-xl 44/48 bold (the hero number), display 32/38, title-lg 24/30, title 19/25, body-lg 17/24, body 15/21, label 13/18 medium, mono 13/18 for raw bank text. Everything must survive 200% dynamic type without clipping.
>
> **Numbers and language.** Dutch formatting: `€ 1.234,56` with a dot for thousands and a comma for decimals, minus sign `−` not a hyphen, dates as `di 3 sep`, months lowercase, Monday first. All UI text in Dutch, informal *je/jij*, sentence case, **no exclamation marks anywhere**, no emoji, buttons are verbs (`Opslaan`, `Bank koppelen`).
>
> **Screens to deliver**, light and dark, at 100% and 200% type, with loading / empty / error states for each:
> 1. **Vandaag (home)** — hero card with "Veilig te besteden € 412 · nog 11 dagen · € 37 per dag"; a horizontal "Komt eraan" strip of upcoming bills for the next 14 days; a "Te controleren" work list; potjes that are behind; recent transactions. Also design the negative variant ("Je komt € 142 tekort deze periode") and the unknown variant.
> 2. **Uitleg-sheet** — a bottom sheet that breaks the hero number into its seven components (saldo, nog te verwerken, inkomen dat nog komt, vaste lasten die nog afgaan, opzij voor potjes, gepland voor boodschappen, buffer). This sheet is what makes the number trustworthy; design it as carefully as the home screen.
> 3. **Transacties** — day-grouped list with sticky headers, merchant logos, category chips, pending rows at 60% opacity, swipe actions, a filter chip row, and a focused "review mode" card stack for categorising a backlog quickly.
> 4. **Transactie detail** — with locked bank-provided fields, a category picker, splitting with other people, and a raw bank description in mono.
> 5. **Potjes** — cards with progress rings, "€ 84 achter" status chips, and a create sheet whose live preview says "Dat is € 145 per maand."
> 6. **Overzicht** — a four-segment donut in the fixed bucket order and colours, planned-vs-actual bars, top categories with deltas.
> 7. **Bank koppelen** — bank picker grid with logos, a plain three-bullet explainer of what happens, and a permanent, prominent line: "Alleen-lezen. Kwartje kan nooit geld overmaken." Plus a "Handmatig beginnen" escape that is never buried.
> 8. **Abonnementen** — recurring charges with next-charge dates, "duurder geworden" badges, and a hedged "waarschijnlijk maandelijks opzegbaar vanaf 3 april 2027".
> 9. **Onboarding** — four steps: welkom, huishouden (composition + when your salary arrives), bank or manual, first potje.
> 10. **Paywall** — one screen, honest, no timers, no scarcity, price shown per month and per year with the yearly saving in euros.
>
> **Components to specify**: Text, Money, Button (primary/secondary/ghost/danger), Card, ListRow with swipe actions, CategoryChip, ProgressBar (with a hatched over-fill), ProgressRing, AmountInput with a numeric pad, Sheet, SegmentedControl, EmptyState, Banner (info/warn/danger), Skeleton, and chart wrappers (donut, bar, line, sparkline).
>
> **Hard constraints.**
> - Minimum touch target 44×44 including chips.
> - Never encode meaning in colour alone — always pair with an icon or label.
> - Every list needs a designed empty state that teaches, not decorates.
> - Every number on screen is tappable and leads to the transactions behind it.
> - Nothing may look like a bank's login screen.
> - No dark patterns anywhere, especially in the paywall.
> - Design for a user with 10.000 transactions and for one with zero.
>
> **Deliver**: (1) a token sheet — colour, type, spacing `2 4 8 12 16 20 24 32 40 56 72`, radius `8/12/16/24/full`, two elevation levels; (2) the component library with all states; (3) the ten screens above in both themes; (4) a one-page rationale explaining the three decisions you are least sure about.

## B. Follow-up prompts

**Iterate on the hero:**
> Show me three variants of the Vandaag hero card: (a) number-led with the period as a small chip, (b) number plus an inline mini-forecast sparkline, (c) number plus a daily-allowance ring. Same tokens, same type scale. Explain which one still works when the number is negative and when it is unknown.

**Stress-test:**
> Redraw Vandaag and Transacties at 200% dynamic type, in dark mode, in Dutch, with the longest realistic strings (`Huishoudelijke uitgaven`, `Waarschijnlijk maandelijks opzegbaar vanaf 3 april 2027`, `€ 12.345,67`). Nothing may truncate in a way that loses meaning.

**Empty states:**
> Design the empty state for every list in the app: transacties, potjes, abonnementen, splits, rekeningen, review queue. Each one: icon or small illustration, one sentence explaining what belongs here, one primary action. No stock illustrations of people holding coins.

**Accessibility audit:**
> Audit the design set: list every text/background pair with its contrast ratio, every place meaning is carried by colour alone, every touch target under 44pt, and the VoiceOver reading order for Vandaag.

## C. What the designer must NOT do

- Invent new bucket names, colours or ordering.
- Introduce a second accent colour or a gradient system.
- Use red for over-budget.
- Add gamification, streaks, badges, avatars, mascots, or celebratory animation.
- Add English UI labels.
- Design a screen that collects bank credentials inside our app.
- Design a paywall with a countdown, a pre-ticked option, or a hidden close button.
- Exceed four colours in any chart.

## D. Handoff format

- Tokens as a JSON file matching the shape in `docs/12` §2 so it can be dropped into `src/ui/tokens.ts`.
- Components named exactly as in `docs/12` §5.
- Screens named exactly as the routes in `docs/05` §2.
- Every string in the design must exist in `docs/15` §3 or be added there in the same PR.
