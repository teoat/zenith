// frontend/src/types/locale.ts

// Supported locales
export type SupportedLocale = 'en-US' | 'en-GB' | 'es-ES' | 'fr-FR' | 'de-DE' | 'ja-JP' | 'id-ID' | 'en-MY' | 'en-SG' | 'th-TH';

export interface LocaleSettings {
  locale: SupportedLocale;
  timezone: string;
  dateFormat: 'short' | 'medium' | 'long';
}

// New types for localization formats
export type CalendarFormat = 'gregory' | 'buddhist' | 'islamic' | 'hebrew';
export type CurrencyFormat = 'USD' | 'IDR' | 'SGD' | 'MYR' | 'THB' | 'GBP' | 'EUR' | 'JPY';
export type DecimalFormat = 'standard' | 'accounting' | 'compact';

// Language display names for Settings UI
export const LOCALE_DISPLAY_NAMES: Record<SupportedLocale, string> = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'es-ES': 'Español',
  'fr-FR': 'Français',
  'de-DE': 'Deutsch',
  'ja-JP': '日本語',
  'id-ID': 'Bahasa Indonesia',
  'en-MY': 'English (Malaysia)',
  'en-SG': 'English (Singapore)',
  'th-TH': 'ไทย (Thailand)',
};
