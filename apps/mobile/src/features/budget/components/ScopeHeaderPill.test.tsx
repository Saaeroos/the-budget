import { fireEvent, screen } from '@testing-library/react-native';
import { renderThemed } from '@/ui/testUtils';
import { useBudgetStore } from '../store/useBudgetStore';
import { ScopeHeaderPill } from './ScopeHeaderPill';

describe('ScopeHeaderPill', () => {
  beforeEach(() => {
    useBudgetStore.getState().resetBudget();
  });

  it('renders with active scope label and opens sheet on press', async () => {
    await renderThemed(<ScopeHeaderPill testID="header-pill" />);

    expect(screen.getByTestId('header-pill')).toBeOnTheScreen();
    expect(screen.getByText('Alle rekeningen')).toBeOnTheScreen();

    // Press to open sheet
    await fireEvent.press(screen.getByTestId('header-pill'));
    expect(screen.getByTestId('scope-selector-sheet')).toBeOnTheScreen();

    // Select business scope
    await fireEvent.press(screen.getByTestId('scope-option-business'));
    expect(useBudgetStore.getState().activeScope).toBe('business');
  });

  it('renders with prefix when provided', async () => {
    useBudgetStore.getState().setActiveScope('household');
    await renderThemed(<ScopeHeaderPill prefix="Overzicht" testID="header-pill-prefix" />);

    expect(screen.getByText('Overzicht: Gezamenlijk')).toBeOnTheScreen();
  });
});
