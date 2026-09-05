import { cents, type Cents } from '@shared';

/* ── Types ────────────────────────────────────────────── */

export interface LocalYearlyExpense {
  readonly id: string;
  readonly name: string;
  readonly amountCents: Cents;
  readonly dueMonth: string;
  readonly quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  readonly categoryKey: string;
  readonly linkedEnvelopeId?: string;
}

/* ── Fixtures ─────────────────────────────────────────── */

export function createDefaultYearlyExpenses(): readonly LocalYearlyExpense[] {
  return [
    {
      id: 'yr-1',
      name: 'Gemeente- & waterschapsbelasting',
      amountCents: cents(84000),
      dueMonth: 'Maart',
      quarter: 'Q1',
      categoryKey: 'tax_municipal',
      linkedEnvelopeId: 'emergency_buffer',
    },
    {
      id: 'yr-2',
      name: 'Energie jaarafrekening',
      amountCents: cents(32000),
      dueMonth: 'April',
      quarter: 'Q2',
      categoryKey: 'energy_water',
    },
    {
      id: 'yr-3',
      name: 'Autoverzekering & APK',
      amountCents: cents(65000),
      dueMonth: 'Juli',
      quarter: 'Q3',
      categoryKey: 'car_insurance',
      linkedEnvelopeId: 'car_insurance',
    },
    {
      id: 'yr-4',
      name: 'Contributie sport & vereniging',
      amountCents: cents(24000),
      dueMonth: 'September',
      quarter: 'Q3',
      categoryKey: 'subscriptions',
    },
    {
      id: 'yr-5',
      name: 'Eigen risico zorgverzekering',
      amountCents: cents(38500),
      dueMonth: 'December',
      quarter: 'Q4',
      categoryKey: 'health_insurance',
    },
  ];
}
