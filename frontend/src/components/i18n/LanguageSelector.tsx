import React, { useEffect } from "react";
import { translations, Language, isRTL } from "@/services/i18n";
import { usePersistedState } from "@/hooks/usePersistedState";

const LanguageSelector: React.FC = () => {
  const [currentLang, setCurrentLang] = usePersistedState<Language>(
    "app_language",
    "en",
  );

  useEffect(() => {
    // Apply RTL direction globally
    document.dir = isRTL(currentLang) ? "rtl" : "ltr";
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
        {translations[currentLang].language}
      </span>
      <select
        value={currentLang}
        onChange={(e) => setCurrentLang(e.target.value as Language)}
        className="bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 px-2 py-1 outline-none focus:border-blue-500"
      >
        <option value="en">English (US)</option>
        <option value="es">Español</option>
        <option value="ar">العربية (Arabic)</option>
        <option value="zh">中文 (Chinese)</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
