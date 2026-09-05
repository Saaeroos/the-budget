import { fireEvent, render } from '@testing-library/react-native';
import { I18nProvider } from '@/i18n';
import { ThemeProvider } from '@/ui';
import { SettingsScreen } from './SettingsScreen';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    canGoBack: () => true,
  }),
}));

jest.mock('@/providers/AuthProvider', () => ({
  useAuth: jest.fn(() => ({
    isDevBypass: true,
    signOut: jest.fn(),
  })),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockBack.mockClear();
  });

  it('renders all sections and back button, and handles navigation', async () => {

    const screen = await render(
      <I18nProvider locale="nl">
        <ThemeProvider>
          <SettingsScreen />
        </ThemeProvider>
      </I18nProvider>,
    );

    expect(screen.getByTestId('instellingen-screen')).toBeTruthy();
    expect(screen.getByText('Instellingen')).toBeTruthy();
    expect(screen.getByText('ACCOUNT & HUISHOUDEN')).toBeTruthy();
    expect(screen.getByText('VOORKEUREN')).toBeTruthy();
    expect(screen.getByText('OVER KWARTJE')).toBeTruthy();

    // Verify back button is present
    expect(screen.getByRole('button', { name: 'Terug' })).toBeTruthy();

    // Navigate to Household settings
    const householdBtn = screen.getByRole('button', { name: 'Huishouden & Partner' });
    fireEvent.press(householdBtn);
    expect(mockPush).toHaveBeenCalledWith('/instellingen/huishouden');

    // Tap back button
    const backBtn = screen.getByRole('button', { name: 'Terug' });
    fireEvent.press(backBtn);
    expect(mockBack).toHaveBeenCalled();
  });
});
