import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { prefsStorage, toPersistStorage } from '@/lib/storage';

/* ── Text ─────────────────────────────────────────────── */
// (none — internal state management only)

/* ── Types ────────────────────────────────────────────── */

export type HouseholdComposition = 'single' | 'partner' | 'family';
export type IncomeCadence = 'calendar_month' | 'custom_month' | 'four_weeks';

export interface HouseholdSetupData {
  readonly composition: HouseholdComposition;
  readonly adults: number;
  readonly children: number;
  readonly incomeCadence: IncomeCadence;
  readonly incomeDay: number;
}

export interface BankSetupData {
  readonly selectedBankId: string | null;
  readonly isManual: boolean;
}

export interface FirstEnvelopeData {
  readonly id: string;
  readonly name: string;
  readonly targetCents: number;
  readonly monthlyCents: number;
  readonly icon: string;
}

export interface OnboardingState {
  readonly currentStep: number;
  readonly household: HouseholdSetupData;
  readonly bank: BankSetupData;
  readonly confirmedCategories: readonly string[];
  readonly firstEnvelope: FirstEnvelopeData | null;
  readonly isOnboardingCompleted: boolean;
  readonly setStep: (step: number) => void;
  readonly setHousehold: (data: Partial<HouseholdSetupData>) => void;
  readonly setBank: (data: BankSetupData) => void;
  readonly toggleCategory: (key: string) => void;
  readonly setFirstEnvelope: (envelope: FirstEnvelopeData | null) => void;
  readonly completeOnboarding: () => void;
  readonly resetOnboarding: () => void;
}

const DEFAULT_HOUSEHOLD: HouseholdSetupData = {
  composition: 'single',
  adults: 1,
  children: 0,
  incomeCadence: 'calendar_month',
  incomeDay: 24,
};

const DEFAULT_CATEGORIES: readonly string[] = [
  'rent_mortgage',
  'health_insurance',
  'energy_water',
  'internet_tv',
  'taxes',
];

const DEFAULT_BANK: BankSetupData = {
  selectedBankId: null,
  isManual: false,
};

const LIMITS = { storageKey: 'kwartje.onboarding' } as const;

/* ── Implementation ───────────────────────────────────── */

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 1,
      household: DEFAULT_HOUSEHOLD,
      bank: DEFAULT_BANK,
      confirmedCategories: DEFAULT_CATEGORIES,
      firstEnvelope: null,
      isOnboardingCompleted: false,
      setStep: (step) => set({ currentStep: step }),
      setHousehold: (patch) =>
        set((prev) => ({
          household: {
            ...prev.household,
            ...patch,
            adults: patch.composition === 'single' ? 1 : Math.max(patch.adults ?? prev.household.adults, 2),
            children: patch.composition === 'family' ? Math.max(patch.children ?? prev.household.children, 1) : 0,
          },
        })),
      setBank: (bank) => set({ bank }),
      toggleCategory: (key) =>
        set((prev) => ({
          confirmedCategories: prev.confirmedCategories.includes(key)
            ? prev.confirmedCategories.filter((c) => c !== key)
            : [...prev.confirmedCategories, key],
        })),
      setFirstEnvelope: (firstEnvelope) => set({ firstEnvelope }),
      completeOnboarding: () => set({ isOnboardingCompleted: true, currentStep: 6 }),
      resetOnboarding: () =>
        set({
          currentStep: 1,
          household: DEFAULT_HOUSEHOLD,
          bank: DEFAULT_BANK,
          confirmedCategories: DEFAULT_CATEGORIES,
          firstEnvelope: null,
          isOnboardingCompleted: false,
        }),
    }),
    {
      name: LIMITS.storageKey,
      storage: createJSONStorage(() => toPersistStorage(prefsStorage)),
    },
  ),
);

/* ── Narrow selectors ──────────────────────────────────── */

export const useCurrentStep = (): number => useOnboardingStore((s) => s.currentStep);
export const useHouseholdData = (): HouseholdSetupData => useOnboardingStore((s) => s.household);
export const useBankData = (): BankSetupData => useOnboardingStore((s) => s.bank);
export const useConfirmedCategories = (): readonly string[] => useOnboardingStore((s) => s.confirmedCategories);
export const useFirstEnvelope = (): FirstEnvelopeData | null => useOnboardingStore((s) => s.firstEnvelope);
export const useIsOnboardingCompleted = (): boolean => useOnboardingStore((s) => s.isOnboardingCompleted);
