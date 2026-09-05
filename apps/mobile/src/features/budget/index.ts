// Public barrel for the `budget` feature — the only entry point other code may import.
export { BudgetScreen } from './screens/BudgetScreen';
export { BudgetCategoryScreen } from './screens/BudgetCategoryScreen';
export { PeriodPickerScreen } from './screens/PeriodPickerScreen';
export {
  useBudgetStore,
  useSafeToSpend,
  useActiveScope,
  useFilteredAccounts,
  useFilteredTransactions,
} from './store/useBudgetStore';
export { useFreelanceTaxSummary, type FreelanceTaxSummary } from './store/freelanceTaxSummary';
export { ScopeHeaderPill } from './components/ScopeHeaderPill';
export { ScopeSelectorSheet } from './components/ScopeSelectorSheet';
export type {
  ActiveScope,
  BucketKind,
  LocalAccount,
  LocalEnvelope,
  LocalTransaction,
  LocalUpcomingBill,
  LocalYearlyExpense,
} from './store/useBudgetStore';
