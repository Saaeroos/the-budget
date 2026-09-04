import { fireEvent, screen } from '@testing-library/react-native';
import { Button } from './Button';
import { renderThemed } from './testUtils';

describe('Button', () => {
  it('renders its label and responds to a press', async () => {
    const onPress = jest.fn();
    await renderThemed(<Button label="Opslaan" onPress={onPress} testID="save-button" />);

    await fireEvent.press(screen.getByRole('button', { name: 'Opslaan' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders in the light theme', async () => {
    await renderThemed(<Button label="Koppelen" onPress={jest.fn()} testID="connect-button" />, { override: 'licht' });
    expect(screen.getByRole('button', { name: 'Koppelen' })).toBeOnTheScreen();
  });

  it('renders in the dark theme', async () => {
    await renderThemed(<Button label="Koppelen" onPress={jest.fn()} testID="connect-button" />, { override: 'donker' });
    expect(screen.getByRole('button', { name: 'Koppelen' })).toBeOnTheScreen();
  });

  it('falls back to the visible label as its accessibility label', async () => {
    await renderThemed(<Button label="Verwijderen" onPress={jest.fn()} testID="delete-button" />);
    expect(screen.getByLabelText('Verwijderen')).toBeOnTheScreen();
  });

  it('accepts an explicit accessibility label distinct from the visible text', async () => {
    await renderThemed(<Button label="X" accessibilityLabel="Wis laatste cijfer" onPress={jest.fn()} testID="clear-button" />);
    expect(screen.getByLabelText('Wis laatste cijfer')).toBeOnTheScreen();
  });

  it('does not call onPress while disabled', async () => {
    const onPress = jest.fn();
    await renderThemed(<Button label="Opslaan" onPress={onPress} disabled testID="save-button" />);

    await fireEvent.press(screen.getByRole('button', { name: 'Opslaan' }));

    expect(onPress).not.toHaveBeenCalled();
  });
});
