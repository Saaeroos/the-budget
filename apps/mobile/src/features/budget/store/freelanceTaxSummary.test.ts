import { computeFreelanceTaxSummary } from './freelanceTaxSummary';
import {
  createDefaultAccounts,
  createDefaultEnvelopes,
  createDefaultTransactions,
} from './defaultBudgetFixtures';

describe('computeFreelanceTaxSummary', () => {
  it('calculates quarterly BTW and freelance reserves accurately', () => {
    const accounts = createDefaultAccounts();
    const transactions = createDefaultTransactions();
    const envelopes = createDefaultEnvelopes();

    const summary = computeFreelanceTaxSummary({ accounts, transactions, envelopes });

    expect(summary.businessBalance).toBe(845000);
    expect(summary.btwCollected).toBe(105000);
    expect(summary.btwPaid).toBeGreaterThan(0);
    expect(summary.netBtwDue).toBe(98616);
    expect(summary.isBtwFunded).toBe(true);
    expect(summary.quarterName).toBe('Q3 2026');
    expect(summary.daysUntilDeadline).toBe(56);
    expect(summary.trueTakeHome).toBeLessThan(summary.businessBalance);
  });
});
