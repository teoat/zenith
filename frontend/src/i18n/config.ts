import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
// Import translation files
import en from './locales/en.json';
import fr from './locales/fr-FR.json';
import de from './locales/de-DE.json';

const resources = {
  'en-US': {
    translation: en
  },
  'fr-FR': {
    translation: fr
  },
  'de-DE': {
    translation: de
  }
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: import.meta.env.DEV, // Enable debug in development
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
    react: {
        useSuspense: true, // Use suspense for loading translations
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    backend: {
      loadPath: '/locales/{{lng}}.json',
    }
  });

export default i18n;
