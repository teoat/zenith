import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './locales/en.json';
import ar from './locales/ar.json';
import es from './locales/es.json';
import fr from './locales/fr-FR.json';
import de from './locales/de-DE.json';
import he from './locales/he.json';
import id from './locales/id.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';

const resources = {
  'en-US': {
    translation: en
  },
  'ar-SA': {
    translation: ar
  },
  'es-ES': {
    translation: es
  },
  'fr-FR': {
    translation: fr
  },
  'de-DE': {
    translation: de
  },
  'he-IL': {
    translation: he
  },
  'id-ID': {
    translation: id
  },
  'ja-JP': {
    translation: ja
  },
  'zh-CN': {
    translation: zh
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
