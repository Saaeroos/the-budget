import { useOnboardingStore } from './useOnboardingStore';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.getState().resetOnboarding();
  });

  it('initializes with default step and values', () => {
    const state = useOnboardingStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.isOnboardingCompleted).toBe(false);
    expect(state.household.composition).toBe('single');
  });

  it('updates household data and recalculates adults/children', () => {
    useOnboardingStore.getState().setHousehold({ composition: 'family', children: 2 });
    const state = useOnboardingStore.getState();
    expect(state.household.composition).toBe('family');
    expect(state.household.adults).toBe(2);
    expect(state.household.children).toBe(2);
  });

  it('toggles recurring categories correctly', () => {
    const initialCategories = useOnboardingStore.getState().confirmedCategories;
    expect(initialCategories).toContain('rent_mortgage');

    useOnboardingStore.getState().toggleCategory('rent_mortgage');
    expect(useOnboardingStore.getState().confirmedCategories).not.toContain('rent_mortgage');

    useOnboardingStore.getState().toggleCategory('rent_mortgage');
    expect(useOnboardingStore.getState().confirmedCategories).toContain('rent_mortgage');
  });

  it('completes onboarding and resets cleanly', () => {
    useOnboardingStore.getState().completeOnboarding();
    expect(useOnboardingStore.getState().isOnboardingCompleted).toBe(true);
    expect(useOnboardingStore.getState().currentStep).toBe(6);

    useOnboardingStore.getState().resetOnboarding();
    expect(useOnboardingStore.getState().isOnboardingCompleted).toBe(false);
    expect(useOnboardingStore.getState().currentStep).toBe(1);
  });
});
