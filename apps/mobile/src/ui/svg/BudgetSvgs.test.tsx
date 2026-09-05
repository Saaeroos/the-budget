import { renderThemed } from '../testUtils';
import {
  KwartjeMarkSvg,
  BucketVasteLastenSvg,
  BucketReserveringenSvg,
  BucketHuishoudelijkSvg,
  BucketVrijBesteedbaarSvg,
  SafeToSpendSvg,
  BankConnectSvg,
  IncomeSalarisSvg,
  JaarafrekeningSvg,
  NoodfondsBufferSvg,
  ToeslagenSvg,
  EmptyTransactionsSvg,
  EmptyPotjesSvg,
  SavingsGoalReachedSvg,
  WarningOverbudgetSvg,
  NavTodaySvg,
  NavTransactionsSvg,
  NavAddSvg,
  NavPotjesSvg,
  NavOverzichtSvg,
  NavBackSvg,
  NavSettingsSvg,
} from './index';

describe('Budget SVG Components', () => {
  it('renders Kwartje brand mark', async () => {
    const { getByTestId } = await renderThemed(
      <KwartjeMarkSvg testID="kwartje-mark" accessibilityLabel="Kwartje logo" />,
    );
    expect(getByTestId('kwartje-mark')).toBeTruthy();
  });

  it('renders four bucket SVGs', async () => {
    const { getByTestId } = await renderThemed(
      <>
        <BucketVasteLastenSvg testID="bucket-vl" />
        <BucketReserveringenSvg testID="bucket-res" />
        <BucketHuishoudelijkSvg testID="bucket-hh" />
        <BucketVrijBesteedbaarSvg testID="bucket-vb" />
      </>,
    );
    expect(getByTestId('bucket-vl')).toBeTruthy();
    expect(getByTestId('bucket-res')).toBeTruthy();
    expect(getByTestId('bucket-hh')).toBeTruthy();
    expect(getByTestId('bucket-vb')).toBeTruthy();
  });

  it('renders financial feature illustrations', async () => {
    const { getByTestId } = await renderThemed(
      <>
        <SafeToSpendSvg testID="safe-to-spend" />
        <BankConnectSvg testID="bank-connect" />
        <IncomeSalarisSvg testID="income-salaris" />
        <JaarafrekeningSvg testID="jaarafrekening" />
        <NoodfondsBufferSvg testID="noodfonds-buffer" />
        <ToeslagenSvg testID="toeslagen" />
      </>,
    );
    expect(getByTestId('safe-to-spend')).toBeTruthy();
    expect(getByTestId('bank-connect')).toBeTruthy();
    expect(getByTestId('income-salaris')).toBeTruthy();
    expect(getByTestId('jaarafrekening')).toBeTruthy();
    expect(getByTestId('noodfonds-buffer')).toBeTruthy();
    expect(getByTestId('toeslagen')).toBeTruthy();
  });

  it('renders empty states and alerts', async () => {
    const { getByTestId } = await renderThemed(
      <>
        <EmptyTransactionsSvg testID="empty-tx" />
        <EmptyPotjesSvg testID="empty-potjes" />
        <SavingsGoalReachedSvg testID="goal-reached" />
        <WarningOverbudgetSvg testID="warning-overbudget" />
      </>,
    );
    expect(getByTestId('empty-tx')).toBeTruthy();
    expect(getByTestId('empty-potjes')).toBeTruthy();
    expect(getByTestId('goal-reached')).toBeTruthy();
    expect(getByTestId('warning-overbudget')).toBeTruthy();
  });

  it('renders navigation SVGs', async () => {
    const { getByTestId } = await renderThemed(
      <>
        <NavTodaySvg testID="nav-today" />
        <NavTransactionsSvg testID="nav-tx" />
        <NavAddSvg testID="nav-add" />
        <NavPotjesSvg testID="nav-potjes" />
        <NavOverzichtSvg testID="nav-overzicht" />
        <NavBackSvg testID="nav-back" />
        <NavSettingsSvg testID="nav-settings" />
      </>,
    );
    expect(getByTestId('nav-today')).toBeTruthy();
    expect(getByTestId('nav-tx')).toBeTruthy();
    expect(getByTestId('nav-add')).toBeTruthy();
    expect(getByTestId('nav-potjes')).toBeTruthy();
    expect(getByTestId('nav-overzicht')).toBeTruthy();
    expect(getByTestId('nav-back')).toBeTruthy();
    expect(getByTestId('nav-settings')).toBeTruthy();
  });
});
