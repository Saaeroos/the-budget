import { fireEvent } from '@testing-library/react-native';
import { allQuartersForYear } from '@shared';
import { renderThemed } from '@/ui/testUtils';
import { QuarterSelector } from './QuarterSelector';

describe('QuarterSelector', () => {
  const quarters = allQuartersForYear(2026);

  it('renders all quarters and distinguishes filed quarters', async () => {
    const onSelect = jest.fn();
    const screen = await renderThemed(
      <QuarterSelector
        quarters={quarters}
        selectedQuarter={3}
        filedQuarters={[1, 2]}
        onSelectQuarter={onSelect}
      />,
    );

    // Q1 and Q2 should show checkmark for filed
    expect(screen.getByText('✓ Q1 2026')).toBeTruthy();
    expect(screen.getByText('✓ Q2 2026')).toBeTruthy();
    // Q3 and Q4 are unfiled
    expect(screen.getByText('Q3 2026')).toBeTruthy();
    expect(screen.getByText('Q4 2026')).toBeTruthy();

    // Selecting Q1 triggers callback
    fireEvent.press(screen.getByText('✓ Q1 2026'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
