import { screen } from '@testing-library/react-native';
import { cents } from '@shared';
import { Money } from './Money';
import { renderThemed } from './testUtils';

describe('Money', () => {
  it('renders the formatted euro amount', async () => {
    await renderThemed(<Money cents={cents(123_456)} testID="money" />);
    expect(screen.getByText('€ 1.234,56')).toBeOnTheScreen();
  });

  it('renders a negative amount with the minus sign, not a hyphen', async () => {
    await renderThemed(<Money cents={cents(-4200)} testID="money" />);
    expect(screen.getByText('−€ 42,00')).toBeOnTheScreen();
  });

  it('renders in the light theme', async () => {
    await renderThemed(<Money cents={cents(100)} testID="money" />, { override: 'licht' });
    expect(screen.getByTestId('money')).toBeOnTheScreen();
  });

  it('renders in the dark theme', async () => {
    await renderThemed(<Money cents={cents(100)} testID="money" />, { override: 'donker' });
    expect(screen.getByTestId('money')).toBeOnTheScreen();
  });

  it('exposes the amount as speech, not as a currency symbol', async () => {
    await renderThemed(<Money cents={cents(41_250)} testID="money" />);
    expect(screen.getByLabelText('412 euro en 50 cent')).toBeOnTheScreen();
  });

  it('reads a negative amount as speech with the word "min"', async () => {
    await renderThemed(<Money cents={cents(-4200)} testID="money" />);
    expect(screen.getByLabelText('min 42 euro')).toBeOnTheScreen();
  });
});
