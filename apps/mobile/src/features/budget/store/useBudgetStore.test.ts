import { cents } from '@shared';
import { useBudgetStore } from './useBudgetStore';

describe('useBudgetStore', () => {
  beforeEach(() => {
    useBudgetStore.getState().resetBudget();
  });

  it('initialises with default accounts and transactions', () => {
    const state = useBudgetStore.getState();
    expect(state.accounts.length).toBeGreaterThan(0);
    expect(state.transactions.length).toBeGreaterThan(0);
    expect(state.envelopes.length).toBeGreaterThan(0);
    expect(state.upcomingBills.length).toBeGreaterThan(0);
  });

  it('adds a transaction', () => {
    const initialCount = useBudgetStore.getState().transactions.length;
    useBudgetStore.getState().addTransaction({
      date: '2026-09-05',
      counterpartyName: 'Bakkerij Bart',
      description: 'Broodjes',
      amountCents: cents(-850),
      categoryKey: 'groceries',
      bucket: 'huishoudelijk',
      accountId: 'acc-main',
    });

    const state = useBudgetStore.getState();
    expect(state.transactions.length).toBe(initialCount + 1);
    expect(state.transactions[0]?.counterpartyName).toBe('Bakkerij Bart');
  });

  it('categorises an unreviewed transaction', () => {
    const state = useBudgetStore.getState();
    const unreviewed = state.transactions.find((t) => !t.isReviewed);
    expect(unreviewed).toBeDefined();

    if (unreviewed) {
      state.categorizeTransaction(unreviewed.id, 'dining', 'vrij_besteedbaar');
      const updated = useBudgetStore.getState().transactions.find((t) => t.id === unreviewed.id);
      expect(updated?.categoryKey).toBe('dining');
      expect(updated?.bucket).toBe('vrij_besteedbaar');
      expect(updated?.isReviewed).toBe(true);
    }
  });

  it('adds an envelope and deposits to it', () => {
    const initialCount = useBudgetStore.getState().envelopes.length;
    useBudgetStore.getState().addEnvelope({
      name: 'Nieuwe Laptop',
      targetCents: cents(150000),
      currentCents: cents(0),
      monthlyCents: cents(12500),
      icon: 'laptop',
    });

    const state = useBudgetStore.getState();
    expect(state.envelopes.length).toBe(initialCount + 1);
    const created = state.envelopes.find((e) => e.name === 'Nieuwe Laptop');
    expect(created).toBeDefined();

    if (created) {
      state.depositToEnvelope(created.id, cents(25000));
      const updated = useBudgetStore.getState().envelopes.find((e) => e.id === created.id);
      expect(updated?.currentCents).toBe(cents(25000));
    }
  });

  it('initialises from onboarding envelope', () => {
    useBudgetStore.getState().initFromOnboardingEnvelope({
      id: 'custom_bike',
      name: 'Elektrische Fiets',
      targetCents: 200000,
      monthlyCents: 10000,
      icon: 'bike',
    });

    const state = useBudgetStore.getState();
    const found = state.envelopes.find((e) => e.id === 'custom_bike');
    expect(found).toBeDefined();
    expect(found?.name).toBe('Elektrische Fiets');
  });

  it('includes credit card and supports updating account balance', () => {
    const state = useBudgetStore.getState();
    const card = state.accounts.find((a) => a.type === 'card');
    expect(card).toBeDefined();
    expect(card?.balanceCents).toBe(-34500);
    expect(card?.creditLimitCents).toBe(250000);

    state.setAccountBalance('acc-main', cents(-15000));
    const updatedMain = useBudgetStore.getState().accounts.find((a) => a.id === 'acc-main');
    expect(updatedMain?.balanceCents).toBe(-15000);
  });

  it('supports activeScope switching between all, personal, household, and business', () => {
    const state = useBudgetStore.getState();
    expect(state.activeScope).toBe('all');

    state.setActiveScope('business');
    expect(useBudgetStore.getState().activeScope).toBe('business');

    state.setActiveScope('household');
    expect(useBudgetStore.getState().activeScope).toBe('household');

    state.setActiveScope('personal');
    expect(useBudgetStore.getState().activeScope).toBe('personal');
  });

  it('tracks and toggles filed BTW quarters', () => {
    const state = useBudgetStore.getState();
    expect(state.filedBtwQuarters).toEqual([1, 2]);

    // File Q3
    state.toggleQuarterFiled(3);
    expect(useBudgetStore.getState().filedBtwQuarters).toEqual([1, 2, 3]);

    // Unfile Q3 back (marking as unfiled)
    state.toggleQuarterFiled(3);
    expect(useBudgetStore.getState().filedBtwQuarters).toEqual([1, 2]);

    // Unfile Q1 back
    state.toggleQuarterFiled(1);
    expect(useBudgetStore.getState().filedBtwQuarters).toEqual([2]);
  });
});
