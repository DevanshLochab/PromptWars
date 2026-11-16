/**
 * Saans i18n System
 * Provides multi-lingual translations (EN/HI) with parameter interpolation
 * and React hook integration.
 */

import { en } from './en';
import { hi } from './hi';
import { useProfile } from '@/lib/store/ProfileProvider';

export type Language = 'en' | 'hi';

const catalogues: Record<Language, Record<string, string>> = {
  en,
  hi,
};

/**
 * Pure translation function for string resolution with optional {param} replacement
 */
export function t(
  key: string,
  lang: Language = 'en',
  params?: Record<string, string | number>
): string {
  const catalogue = catalogues[lang] || catalogues.en;
  let text = catalogue[key] || catalogues.en[key] || key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return text;
}

/**
 * React hook for consuming translations tied to user's selected language
 */
export function useTranslation() {
  const { language, updateLanguage } = useProfile();

  const translate = (key: string, params?: Record<string, string | number>): string => {
    return t(key, language, params);
  };

  return {
    t: translate,
    lang: language,
    setLang: updateLanguage,
  };
}

export { en, hi };
