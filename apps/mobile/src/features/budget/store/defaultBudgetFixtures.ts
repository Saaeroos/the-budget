import { cents, nlDateFromJsDate, type AccountType, type Cents } from '@shared';

/* ── Types ────────────────────────────────────────────── */

export type BucketKind = 'vaste_lasten' | 'reserveringen' | 'huishoudelijk' | 'vrij_besteedbaar' | 'inkomen';

export interface LocalAccount {
  readonly id: string;
  readonly name: string;
  readonly type: AccountType;
  readonly iban: string;
  readonly balanceCents: Cents;
  readonly institutionId: string;
  readonly creditLimitCents?: Cents | undefined;
  readonly scope?: 'personal' | 'household' | 'business' | undefined;
}

export interface LocalTransaction {
  readonly id: string;
  readonly date: string;
  readonly counterpartyName: string;
  readonly description: string;
  readonly amountCents: Cents;
  readonly categoryKey: string;
  readonly bucket: BucketKind;
  readonly accountId: string;
  readonly isPending?: boolean | undefined;
  readonly isReviewed?: boolean | undefined;
  readonly scope?: 'personal' | 'business' | 'household' | undefined;
  readonly btwRate?: 0 | 9 | 21 | undefined;
  readonly btwAmountCents?: Cents | undefined;
  readonly isTaxDeductible?: boolean | undefined;
}

export interface LocalEnvelope {
  readonly id: string;
  readonly name: string;
  readonly targetCents: Cents;
  readonly currentCents: Cents;
  readonly monthlyCents: Cents;
  readonly icon: string;
  readonly targetDate?: string;
  readonly isBehind?: boolean;
}

export interface LocalUpcomingBill {
  readonly id: string;
  readonly name: string;
  readonly amountCents: Cents;
  readonly dueOn: string;
  readonly categoryKey: string;
}

/* ── Fixture Data ─────────────────────────────────────── */

const DEFAULT_ACCOUNTS: readonly LocalAccount[] = [
  {
    id: 'acc-main',
    name: 'Betaalrekening',
    type: 'payment',
    scope: 'personal',
    iban: 'NL82INGB0001234567',
    balanceCents: cents(245000),
    institutionId: 'ing',
    creditLimitCents: cents(100000),
  },
  {
    id: 'acc-savings',
    name: 'Spaarrekening',
    type: 'savings',
    scope: 'personal',
    iban: 'NL82INGB0007654321',
    balanceCents: cents(450000),
    institutionId: 'ing',
  },
  {
    id: 'acc-card',
    name: 'ING Creditcard',
    type: 'card',
    scope: 'personal',
    iban: 'NL82INGB0001234567',
    balanceCents: cents(-34500),
    institutionId: 'ing',
    creditLimitCents: cents(250000),
  },
  {
    id: 'acc-biz',
    name: 'Knab Zakelijk (ZZP)',
    type: 'payment',
    scope: 'business',
    iban: 'NL09KNAB0123456789',
    balanceCents: cents(845000),
    institutionId: 'knab',
  },
  {
    id: 'acc-joint',
    name: 'Gezamenlijke Rekening (En/Of)',
    type: 'joint',
    scope: 'household',
    iban: 'NL44ABNA0987654321',
    balanceCents: cents(185000),
    institutionId: 'abn',
  },
];

export function createDefaultAccounts(): readonly LocalAccount[] {
  return DEFAULT_ACCOUNTS;
}

const DEFAULT_ENVELOPES: readonly LocalEnvelope[] = [
  {
    id: 'car_insurance',
    name: 'Autoverzekering & Belasting',
    targetCents: cents(48000),
    currentCents: cents(16000),
    monthlyCents: cents(4000),
    icon: 'car',
    targetDate: '2026-12-01',
    isBehind: false,
  },
  {
    id: 'vacation',
    name: 'Zomervakantie',
    targetCents: cents(120000),
    currentCents: cents(45000),
    monthlyCents: cents(15000),
    icon: 'vacation',
    targetDate: '2026-07-01',
    isBehind: false,
  },
  {
    id: 'emergency_buffer',
    name: 'Noodfonds Buffer',
    targetCents: cents(100000),
    currentCents: cents(60000),
    monthlyCents: cents(5000),
    icon: 'buffer',
    targetDate: '2026-10-01',
    isBehind: false,
  },
  {
    id: 'btw_q3',
    name: 'BTW Kwartaal 3 (Belastingdienst)',
    targetCents: cents(98616),
    currentCents: cents(98616),
    monthlyCents: cents(32872),
    icon: 'buffer',
    targetDate: '2026-10-31',
    isBehind: false,
  },
  {
    id: 'ib_reserve',
    name: 'Inkomstenbelasting Reserve',
    targetCents: cents(500000),
    currentCents: cents(320000),
    monthlyCents: cents(41667),
    icon: 'buffer',
    targetDate: '2027-05-01',
    isBehind: false,
  },
];

export function createDefaultEnvelopes(): readonly LocalEnvelope[] {
  return DEFAULT_ENVELOPES;
}

interface BillTemplate {
  readonly id: string;
  readonly name: string;
  readonly amountCents: Cents;
  readonly categoryKey: string;
  readonly day?: string;
  readonly fixedDueOn?: string;
}

const BILL_TEMPLATES: readonly BillTemplate[] = [
  { id: 'bill-rent', name: 'Huur / Hypotheek', amountCents: cents(95000), categoryKey: 'rent_mortgage', day: '01' },
  { id: 'bill-health', name: 'Zorgverzekering Zilveren Kruis', amountCents: cents(14500), categoryKey: 'health_insurance', day: '20' },
  { id: 'bill-energy', name: 'Vattenfall Energie', amountCents: cents(18500), categoryKey: 'energy_water', day: '24' },
  { id: 'bill-internet', name: 'KPN Internet & TV', amountCents: cents(5500), categoryKey: 'internet_tv', day: '27' },
  { id: 'bill-streaming', name: 'Netflix & Spotify', amountCents: cents(1800), categoryKey: 'streaming', day: '28' },
  { id: 'bill-creditcard', name: 'ING Creditcard Incasso', amountCents: cents(34500), categoryKey: 'creditcard', day: '28' },
  { id: 'bill-btw-q3', name: 'Belastingdienst BTW Aangifte Q3', amountCents: cents(98600), categoryKey: 'taxes', fixedDueOn: '-10-31' },
];

export function createDefaultUpcomingBills(): readonly LocalUpcomingBill[] {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');

  return BILL_TEMPLATES.map((tmpl) => ({
    id: tmpl.id,
    name: tmpl.name,
    amountCents: tmpl.amountCents,
    categoryKey: tmpl.categoryKey,
    dueOn: tmpl.fixedDueOn ? `${y}${tmpl.fixedDueOn}` : `${y}-${m}-${tmpl.day}`,
  }));
}

interface MakeTxInput {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly amount: number;
  readonly category: string;
  readonly bucket: BucketKind;
  readonly isReviewed?: boolean | undefined;
  readonly scope?: 'personal' | 'business' | 'household' | undefined;
  readonly btwRate?: 0 | 9 | 21 | undefined;
  readonly btwAmountCents?: number | undefined;
  readonly isTaxDeductible?: boolean | undefined;
  readonly accountId?: string | undefined;
}

function makeTx(input: MakeTxInput): LocalTransaction {
  return {
    id: input.id,
    date: nlDateFromJsDate(new Date()),
    counterpartyName: input.name,
    description: input.desc,
    amountCents: cents(input.amount),
    categoryKey: input.category,
    bucket: input.bucket,
    accountId: input.accountId ?? 'acc-main',
    isReviewed: input.isReviewed ?? true,
    scope: input.scope ?? 'personal',
    btwRate: input.btwRate,
    btwAmountCents: input.btwAmountCents ? cents(input.btwAmountCents) : undefined,
    isTaxDeductible: input.isTaxDeductible,
  };
}

export function createDefaultTransactions(): readonly LocalTransaction[] {
  return [
    makeTx({ id: 'tx-1', name: 'Albert Heijn', desc: 'Boodschappen week 36', amount: -6845, category: 'groceries', bucket: 'huishoudelijk' }),
    makeTx({ id: 'tx-2', name: 'Koffiebar Het Plein', desc: 'Koffie & lunch', amount: -1280, category: 'dining', bucket: 'vrij_besteedbaar' }),
    makeTx({ id: 'tx-3', name: 'Werkgever BV', desc: 'Salaris augustus', amount: 285000, category: 'salary', bucket: 'inkomen' }),
    makeTx({ id: 'tx-4', name: 'NS Reizigers', desc: 'Treinretour Utrecht Centraal', amount: -2460, category: 'transport', bucket: 'vrij_besteedbaar' }),
    makeTx({ id: 'tx-5', name: 'Zilveren Kruis', desc: 'Zorgpremie', amount: -14500, category: 'health_insurance', bucket: 'vaste_lasten' }),
    makeTx({ id: 'tx-6', name: 'Tikkie van Bram', desc: 'Eentje van gisteren', amount: -2250, category: 'unassigned', bucket: 'vrij_besteedbaar', isReviewed: false }),
    makeTx({ id: 'tx-7', name: 'Onbekende afschrijving', desc: 'Boeking online POS', amount: -3495, category: 'unassigned', bucket: 'vrij_besteedbaar', isReviewed: false }),
    makeTx({ id: 'tx-biz-1', name: 'Acme Studio B.V.', desc: 'Factuur 2026-084 Front-end Q3', amount: 363000, category: 'salary', bucket: 'inkomen', scope: 'business', accountId: 'acc-biz', btwRate: 21, btwAmountCents: 63000 }),
    makeTx({ id: 'tx-biz-2', name: 'Web Solutions Amsterdam', desc: 'Factuur 2026-089 Consultancy', amount: 242000, category: 'salary', bucket: 'inkomen', scope: 'business', accountId: 'acc-biz', btwRate: 21, btwAmountCents: 42000 }),
    makeTx({ id: 'tx-biz-3', name: 'TransIP Webhosting', desc: 'VPS & Domeinnaam registratie', amount: -12100, category: 'internet_tv', bucket: 'vaste_lasten', scope: 'business', accountId: 'acc-biz', btwRate: 21, btwAmountCents: 2100, isTaxDeductible: true }),
    makeTx({ id: 'tx-biz-4', name: 'Adobe Creative Cloud', desc: 'Abonnement Creative Cloud Pro', amount: -6534, category: 'streaming', bucket: 'vaste_lasten', scope: 'business', accountId: 'acc-biz', btwRate: 21, btwAmountCents: 1134, isTaxDeductible: true }),
    makeTx({ id: 'tx-biz-5', name: 'Boekhouder & Fiscaal Advies', desc: 'Kwartaalaangifte Q2 & Advies', amount: -18150, category: 'unassigned', bucket: 'vaste_lasten', scope: 'business', accountId: 'acc-biz', btwRate: 21, btwAmountCents: 3150, isTaxDeductible: true }),
    makeTx({ id: 'tx-biz-6', name: 'Naar privérekening', desc: 'Privé-onttrekking september', amount: -250000, category: 'unassigned', bucket: 'vrij_besteedbaar', scope: 'business', accountId: 'acc-biz', isTaxDeductible: false }),
    makeTx({ id: 'tx-joint-1', name: 'Albert Heijn (En/Of)', desc: 'Gezamenlijke weekboodschappen', amount: -8950, category: 'groceries', bucket: 'huishoudelijk', scope: 'household', accountId: 'acc-joint' }),
  ];
}
