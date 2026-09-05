import { screen } from '@testing-library/react-native';
import { renderThemed } from '../testUtils';
import { BarChart, type BarChartSeries } from './BarChart';

describe('BarChart', () => {
  const series: readonly BarChartSeries[] = [
    { label: 'Inkomen', color: '#2D7A66', values: [2850] },
    { label: 'Uitgaven', color: '#BA3F34', values: [1845] },
  ];

  it('renders with accessibility role and label', async () => {
    await renderThemed(
      <BarChart
        categories={['Deze maand']}
        series={series}
        accessibilityLabel="Inkomsten vs uitgaven"
        testID="income-expense-barchart"
      />,
    );

    expect(screen.getByTestId('income-expense-barchart')).toBeOnTheScreen();
    expect(screen.getByRole('image', { name: 'Inkomsten vs uitgaven' })).toBeOnTheScreen();
    expect(screen.getByText('Deze maand')).toBeOnTheScreen();
  });
});
