# 03 — Personas & jobs-to-be-done

Use these to resolve UX ambiguity. When two designs are defensible, pick the one that serves **Sanne** (primary) first.

---

## P1 — Sanne, 29, Utrecht *(primary, ~45% of target base)*

Works in marketing, rents a 2-room flat, ING + a bunq for savings. Salary on the 24th. Splits everything with friends via Tikkie. Gets zorgtoeslag. No car.

**Situation**: The month is fine until the 18th, then it isn't. She has no idea where the €600 "extra" went, and the €340 tandarts bill in April wrecked her.

**Jobs**
- *When I get paid, I want to know what's actually mine to spend, so I don't have to guess for three weeks.*
- *When a big irregular bill lands, I want to have already paid for it in pieces.*
- *When I pay a Tikkie for six people, I want the app to not count €120 as my dinner.*

**Success**: opens the app 3× a week for 15 seconds; the "veilig te besteden" number is right.

**Design consequences**: the home screen number must be trustworthy and explainable in one tap. Tikkie/split handling is MVP, not v2.

---

## P2 — Bram & Fleur, 36 & 34, Zwolle *(~30%)*

Two incomes, one mortgage, one kid in daycare, one car. Rabobank joint account + two personal accounts. Kinderopvangtoeslag, kindgebonden budget, kinderbijslag. Gemeentebelasting by instalment. Energy jaarafrekening burns them most years.

**Jobs**
- *When we plan the month together, I want one shared picture without merging our personal accounts.*
- *When our income changes, I want to know immediately whether we'll have to pay toeslagen back.*
- *When the jaarafrekening comes, I want it to be boring.*
- *When we split costs, I want it fair by income, not 50/50.*

**Design consequences**: households with personal vs shared scopes; income-ratio split; toeslagen module; obligations with instalment plans. This is the persona that pays for Plus.

---

## P3 — Youssef, 42, Rotterdam *(~15%)*

ZZP frontend developer. Irregular income, quarterly BTW, income tax prepayment, private + business mixed on one account for too long.

**Jobs**
- *When money comes in, I want a slice reserved for BTW and inkomstenbelasting before I feel rich.*
- *When it's aangifte time, I want to export the year without a weekend of work.*
- *When income is lumpy, I want a runway number, not a monthly budget.*

**Design consequences**: BTW-potje with automatic percentage set-aside, business/private tagging, irregular-income budget mode ("runway" instead of "left this month"). **v2**, but the data model must not block it (`transactions.scope`, `envelopes.kind='tax'`).

---

## P4 — Ria, 61, Groningen *(~10%)*

Lives on a modest income, some debts, works with a budgetcoach at the gemeente. Uses SNS. Needs the phone to be simple and the text to be large.

**Jobs**
- *When I look at my money, I want to see whether this month is going to work, in plain words.*
- *When my coach asks for an overzicht, I want to print one that looks like the form she uses.*
- *When money is short, I want to know which bill to move, not be told off.*

**Design consequences**: accessibility is a hard requirement, not a nice-to-have (200% text, high contrast, no colour-only meaning). "Nibud-overzicht" PDF export. Zero-shame language. Kwijtschelding and instalment hints.

---

## Anti-persona

**The optimiser** who wants portfolio tracking, FIRE projections, crypto and multi-currency arbitrage. We will lose them to another app, deliberately. Do not add features for this user.

---

## Jobs → feature map

| Job | Feature | Doc |
|---|---|---|
| Know what's safe to spend | Veilig-te-besteden engine | 10 §5 |
| Never be surprised by a bill | Reserveringspotjes + forecast | 10 §4, §6 |
| See all banks at once | PSD2 multi-connection sync | 08 |
| Don't count group payments as mine | Split & Tikkie reconciliation | 04 F-21 |
| Budget together but keep privacy | Household scopes | 06 §3 |
| Not have to pay toeslagen back | Toeslagen module | 04 F-13 |
| Reserve tax as a ZZP'er | BTW-potje | 04 F-34 (v2) |
| Give my coach an overview | Nibud PDF export | 04 F-29 |
| Stop paying for things I forgot | Abonnementenradar | 04 F-17 |
| Understand my energy settlement | Jaarafrekening tracker | 04 F-15 |
