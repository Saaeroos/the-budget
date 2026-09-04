import { screen } from '@testing-library/react-native';
import { ProgressBar } from './ProgressBar';
import { renderThemed } from './testUtils';

describe('ProgressBar', () => {
  it('renders with the given accessibility label', async () => {
    await renderThemed(<ProgressBar value={40} max={100} testID="progress" accessibilityLabel="Vakantie: 40 van de 100 euro" />);
    expect(screen.getByLabelText('Vakantie: 40 van de 100 euro')).toBeOnTheScreen();
  });

  it('exposes the ratio as an accessibility value', async () => {
    await renderThemed(<ProgressBar value={25} max={100} testID="progress" accessibilityLabel="Boodschappen" />);
    const bar = screen.getByRole('progressbar');
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 25 });
  });

  it('clamps the reported value at 100 when over budget', async () => {
    await renderThemed(<ProgressBar value={150} max={100} testID="progress" accessibilityLabel="Boodschappen" />);
    const bar = screen.getByRole('progressbar');
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 100 });
  });

  it('renders in the light theme', async () => {
    await renderThemed(<ProgressBar value={10} max={100} testID="progress" accessibilityLabel="Boodschappen" />, { override: 'licht' });
    expect(screen.getByTestId('progress')).toBeOnTheScreen();
  });

  it('renders in the dark theme', async () => {
    await renderThemed(<ProgressBar value={10} max={100} testID="progress" accessibilityLabel="Boodschappen" />, { override: 'donker' });
    expect(screen.getByTestId('progress')).toBeOnTheScreen();
  });
});
