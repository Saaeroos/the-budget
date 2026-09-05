import { fireEvent, screen } from '@testing-library/react-native';
import { BottomBackButton } from './BottomBackButton';
import { renderThemed } from './testUtils';

describe('BottomBackButton', () => {
  it('renders with accessible role and label', async () => {
    await renderThemed(<BottomBackButton testID="bottom-back" />);
    expect(screen.getByTestId('bottom-back')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Terug' })).toBeOnTheScreen();
  });

  it('calls onPress when custom onPress is provided', async () => {
    const onPress = jest.fn();
    await renderThemed(<BottomBackButton onPress={onPress} testID="bottom-back" />);
    await fireEvent.press(screen.getByTestId('bottom-back'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
