/**
 * Saans i18n System
 * Provides multi-lingual translations across Indian regional languages
 * with parameter interpolation and React hook integration.
 */

import { en } from './en';
import { hi } from './hi';
import { bn } from './bn';
import { mr } from './mr';
import { te } from './te';
import { ta } from './ta';
import { gu } from './gu';
import { kn } from './kn';
import { pa } from './pa';
import { useProfile } from '@/lib/store/ProfileProvider';
import { Language } from '@/lib/schemas';

export type { Language };

export interface SupportedLanguageInfo {
  code: Language;
  label: string;
  native: string;
  nativeLabel: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguageInfo[] = [
  { code: 'en', label: 'English', native: 'English', nativeLabel: 'English', region: 'All India' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', nativeLabel: 'हिन्दी', region: 'North & Central India' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', nativeLabel: 'বাংলা', region: 'West Bengal & Tripura' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', nativeLabel: 'मराठी', region: 'Maharashtra' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', nativeLabel: 'తెలుగు', region: 'Telangana & Andhra Pradesh' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', nativeLabel: 'தமிழ்', region: 'Tamil Nadu' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', nativeLabel: 'ગુજરાતી', region: 'Gujarat' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', nativeLabel: 'ಕನ್ನಡ', region: 'Karnataka' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', nativeLabel: 'ਪੰਜਾਬੀ', region: 'Punjab & Chandigarh' },
];

const catalogues: Record<Language, Record<string, string>> = {
  en,
  hi: { ...en, ...hi },
  bn: { ...en, ...bn },
  mr: { ...en, ...mr },
  te: { ...en, ...te },
  ta: { ...en, ...ta },
  gu: { ...en, ...gu },
  kn: { ...en, ...kn },
  pa: { ...en, ...pa },
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

export { en, hi, bn, mr, te, ta, gu, kn, pa };
