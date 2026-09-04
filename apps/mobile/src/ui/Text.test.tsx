import { screen } from '@testing-library/react-native';
import { Text } from './Text';
import { renderThemed } from './testUtils';

describe('Text', () => {
  it('renders its children', async () => {
    await renderThemed(<Text>Veilig te besteden</Text>);
    expect(screen.getByText('Veilig te besteden')).toBeOnTheScreen();
  });

  it('renders in the light theme', async () => {
    await renderThemed(<Text>Potjes</Text>, { override: 'licht' });
    expect(screen.getByText('Potjes')).toBeOnTheScreen();
  });

  it('renders in the dark theme', async () => {
    await renderThemed(<Text>Potjes</Text>, { override: 'donker' });
    expect(screen.getByText('Potjes')).toBeOnTheScreen();
  });

  it('exposes an explicit accessibility label when given one', async () => {
    await renderThemed(<Text accessibilityLabel="412 euro">€ 412</Text>);
    expect(screen.getByLabelText('412 euro')).toBeOnTheScreen();
  });
});
