import { fireEvent, screen } from '@testing-library/react-native';
import { Banner } from './Banner';
import { renderThemed } from './testUtils';

describe('Banner', () => {
  it('renders its message as an alert', async () => {
    await renderThemed(<Banner tone="info" message="Je bent offline. Je wijzigingen worden later opgeslagen." />);
    expect(screen.getByRole('alert')).toBeOnTheScreen();
    expect(screen.getByText('Je bent offline. Je wijzigingen worden later opgeslagen.')).toBeOnTheScreen();
  });

  it('renders an action and responds to a press', async () => {
    const onPress = jest.fn();
    await renderThemed(<Banner tone="warn" message="Verloopt over 6 dagen" action={{ label: 'Opnieuw koppelen', onPress }} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Opnieuw koppelen' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders a dismiss control with its own accessibility label', async () => {
    const onDismiss = jest.fn();
    await renderThemed(<Banner tone="info" message="Bijgewerkt bij ING" dismissLabel="Sluiten" onDismiss={onDismiss} />);

    await fireEvent.press(screen.getByLabelText('Sluiten'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders in the light theme', async () => {
    await renderThemed(<Banner tone="danger" message="De koppeling is verlopen." />, { override: 'licht' });
    expect(screen.getByRole('alert')).toBeOnTheScreen();
  });

  it('renders in the dark theme', async () => {
    await renderThemed(<Banner tone="danger" message="De koppeling is verlopen." />, { override: 'donker' });
    expect(screen.getByRole('alert')).toBeOnTheScreen();
  });
});
