import { fireEvent, screen } from '@testing-library/react-native';
import { cents } from '@shared';
import { AmountInput } from './AmountInput';
import { renderThemed } from './testUtils';

describe('AmountInput', () => {
  it('starts at zero and reports each digit typed', async () => {
    const onChangeCents = jest.fn();
    await renderThemed(<AmountInput onChangeCents={onChangeCents} backspaceAccessibilityLabel="Wis laatste cijfer" testID="amount-input" />);

    expect(screen.getByLabelText('0 euro')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('amount-input-key-1'));
    await fireEvent.press(screen.getByTestId('amount-input-key-2'));

    expect(onChangeCents).toHaveBeenLastCalledWith(1200);
  });

  it('treats the comma as the decimal separator, capped at two digits', async () => {
    const onChangeCents = jest.fn();
    await renderThemed(<AmountInput onChangeCents={onChangeCents} backspaceAccessibilityLabel="Wis laatste cijfer" testID="amount-input" />);

    await fireEvent.press(screen.getByTestId('amount-input-key-1'));
    await fireEvent.press(screen.getByTestId('amount-input-key-2'));
    await fireEvent.press(screen.getByTestId('amount-input-key-comma'));
    await fireEvent.press(screen.getByTestId('amount-input-key-5'));

    expect(onChangeCents).toHaveBeenLastCalledWith(1250);
  });

  it('removes the last character on backspace and never goes negative', async () => {
    const onChangeCents = jest.fn();
    await renderThemed(<AmountInput onChangeCents={onChangeCents} backspaceAccessibilityLabel="Wis laatste cijfer" testID="amount-input" />);

    await fireEvent.press(screen.getByTestId('amount-input-key-1'));
    await fireEvent.press(screen.getByLabelText('Wis laatste cijfer'));

    expect(onChangeCents).toHaveBeenLastCalledWith(0);
  });

  it('starts from a given amount', async () => {
    await renderThemed(
      <AmountInput initialCents={cents(4250)} onChangeCents={jest.fn()} backspaceAccessibilityLabel="Wis laatste cijfer" testID="amount-input" />,
    );
    expect(screen.getByLabelText('42 euro en 50 cent')).toBeOnTheScreen();
  });

  it('renders in the light theme', async () => {
    await renderThemed(<AmountInput onChangeCents={jest.fn()} backspaceAccessibilityLabel="Wis laatste cijfer" testID="amount-input" />, {
      override: 'licht',
    });
    expect(screen.getByTestId('amount-input')).toBeOnTheScreen();
  });

  it('renders in the dark theme', async () => {
    await renderThemed(<AmountInput onChangeCents={jest.fn()} backspaceAccessibilityLabel="Wis laatste cijfer" testID="amount-input" />, {
      override: 'donker',
    });
    expect(screen.getByTestId('amount-input')).toBeOnTheScreen();
  });
});
