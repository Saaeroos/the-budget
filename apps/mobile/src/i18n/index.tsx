// `docs/15`: `nl-NL` is the source language, `en-GB` a translation of it. `nl` is always the
// fallback locale — if a key is missing anywhere, Dutch shows rather than a raw key.
import { useEffect, useRef, type ReactNode } from 'react';
import { createInstance, type i18n as I18nInstance } from 'i18next';
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './en.json';
import nl from './nl.json';

export { I18N_KEYS } from './keys';

/* ── Types ────────────────────────────────────────────── */

export type Locale = 'nl' | 'en';

export interface I18nProviderProps {
  readonly children: ReactNode;
  /**
   * Overrides device-locale detection — e.g. a persisted preference read by `@/store`.
   * `src/i18n` never reads storage itself (`.claude/rules/01-architecture.md`).
   */
  readonly locale?: Locale;
}

/* ── Implementation ───────────────────────────────────── */

const FALLBACK_LOCALE: Locale = 'nl';
const SUPPORTED_LOCALES: readonly Locale[] = ['nl', 'en'];
const RESOURCES = { nl: { translation: nl }, en: { translation: en } } as const;

function isSupportedLocale(value: string | null | undefined): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value ?? '');
}

function detectDeviceLocale(): Locale {
  const languageCode = getLocales()[0]?.languageCode;
  return isSupportedLocale(languageCode) ? languageCode : FALLBACK_LOCALE;
}

function createI18nInstance(locale: Locale): I18nInstance {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    resources: RESOURCES,
    lng: locale,
    fallbackLng: FALLBACK_LOCALE,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
}

export function I18nProvider({ children, locale }: I18nProviderProps) {
  const resolvedLocale = locale ?? detectDeviceLocale();
  const instanceRef = useRef<I18nInstance | null>(null);
  if (!instanceRef.current) {
    instanceRef.current = createI18nInstance(resolvedLocale);
  }
  const instance = instanceRef.current;

  useEffect(() => {
    if (instance.language !== resolvedLocale) {
      void instance.changeLanguage(resolvedLocale);
    }
  }, [instance, resolvedLocale]);

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}

/** `const t = useT(); t(TEXT.save)` — the only way feature code resolves a `TEXT` key. */
export function useT() {
  return useTranslation().t;
}
