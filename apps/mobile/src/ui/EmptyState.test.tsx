import { fireEvent, screen } from '@testing-library/react-native';
import { EmptyState } from './EmptyState';
import { renderThemed } from './testUtils';

describe('EmptyState', () => {
  it('renders the title and body', async () => {
    await renderThemed(<EmptyState title="Nog geen potjes" body="Een potje spaart automatisch voor rekeningen die later komen." />);
    expect(screen.getByText('Nog geen potjes')).toBeOnTheScreen();
    expect(screen.getByText('Een potje spaart automatisch voor rekeningen die later komen.')).toBeOnTheScreen();
  });

  it('renders the primary action and responds to a press', async () => {
    const onPress = jest.fn();
    await renderThemed(
      <EmptyState
        title="Nog geen potjes"
        body="Een potje spaart automatisch."
        action={{ label: 'Eerste potje maken', onPress, testID: 'empty-action' }}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Eerste potje maken' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders in the light theme', async () => {
    await renderThemed(<EmptyState title="Nog geen transacties" body="Koppel een bank." />, { override: 'licht' });
    expect(screen.getByText('Nog geen transacties')).toBeOnTheScreen();
  });

  it('renders in the dark theme', async () => {
    await renderThemed(<EmptyState title="Nog geen transacties" body="Koppel een bank." />, { override: 'donker' });
    expect(screen.getByText('Nog geen transacties')).toBeOnTheScreen();
  });

  it('is announced as a summary region for screen readers', async () => {
    await renderThemed(<EmptyState title="Nog geen potjes" body="Een potje spaart automatisch." testID="empty-state" />);
    expect(screen.getByTestId('empty-state').props.accessibilityRole).toBe('summary');
  });
});
