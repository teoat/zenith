export const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    investigation: "Investigation",
    alerts: "Alerts",
    settings: "Settings",
    language: "Language",
    voice_control: "Voice Control",
    contrast: "High Contrast",
    welcome: "Welcome back, Officer."
  },
  es: {
    dashboard: "Panel de Control",
    investigation: "Investigación",
    alerts: "Alertas",
    settings: "Configuración",
    language: "Idioma",
    voice_control: "Control de Voz",
    contrast: "Alto Contraste",
    welcome: "Bienvenido de nuevo, Oficial."
  },
  ar: { // RTL Language
    dashboard: "لوحة القيادة",
    investigation: "تحقيق",
    alerts: "تنبيهات",
    settings: "إعدادات",
    language: "لغة",
    voice_control: "التحكم الصوتي",
    contrast: "تغيير التباين",
    welcome: "مرحبًا بعودتك أيها الضابط."
  },
  zh: {
    dashboard: "仪表盘",
    investigation: "调查",
    alerts: "警报",
    settings: "设置",
    language: "语言",
    voice_control: "语音控制",
    contrast: "高对比度",
    welcome: "欢迎回来，警官。"
  }
};

export type Language = 'en' | 'es' | 'ar' | 'zh';

export const isRTL = (lang: Language): boolean => {
  return lang === 'ar';
};
