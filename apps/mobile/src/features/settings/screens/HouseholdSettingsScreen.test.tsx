import { fireEvent, render } from '@testing-library/react-native';
import { Share } from 'react-native';
import { I18nProvider } from '@/i18n';
import { ThemeProvider } from '@/ui';
import { HouseholdSettingsScreen } from './HouseholdSettingsScreen';

describe('HouseholdSettingsScreen', () => {
  it('renders members, shared accounts, and triggers share', async () => {
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });

    const screen = await render(
      <I18nProvider locale="nl">
        <ThemeProvider>
          <HouseholdSettingsScreen />
        </ThemeProvider>
      </I18nProvider>,
    );

    expect(screen.getByTestId('instellingen-huishouden-screen')).toBeTruthy();
    expect(screen.getByText('KW-8492')).toBeTruthy();

    const inviteBtn = screen.getByTestId('household-invite-button');
    fireEvent.press(inviteBtn);

    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('KW-8492'),
      }),
    );
  });
});
