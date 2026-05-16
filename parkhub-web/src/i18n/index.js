import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.js';

// English-only configuration
export const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', native: 'English' },
];

i18n
  .use(initReactI18next)
  .init({
    resources: { en },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

/** Fetch approved translation overrides from the API and patch into i18n bundles. */
export async function loadTranslationOverrides() {
  try {
    const base = import.meta.env.VITE_API_URL || '';
    const { getInMemoryToken } = await import('../api/client');
    const token = getInMemoryToken();
    const headers = {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(`${base}/api/v1/translations/overrides`, { headers, credentials: 'include' });
    if (!res.ok) return;
    const json = await res.json();
    const overrides = Array.isArray(json) ? json : json?.data ?? [];
    for (const override of overrides) {
      i18n.addResource(override.language, 'translation', override.key, override.value);
    }
  } catch {
    // Silently ignore — overrides are optional
  }
}

export default i18n;
