import React, { createContext, useContext, useEffect } from "react";

/**
 * RTL (Right-to-Left) Support Context
 * Provides RTL direction detection and utilities for RTL languages
 */

type Direction = "ltr" | "rtl";

interface RTLContextType {
  direction: Direction;
  isRTL: boolean;
}

const RTLContext = createContext<RTLContextType>({
  direction: "ltr",
  isRTL: false,
});

/**
 * Hook to get RTL context
 */
export const useRTL = () => useContext(RTLContext);

/**
 * Determines text direction based on language code
 */
const getDirectionFromLanguage = (language: string): Direction => {
  const rtlLanguages = [
    "ar", // Arabic
    "he", // Hebrew
    "fa", // Persian/Farsi
    "ur", // Urdu
    "yi", // Yiddish
    "az", // Azerbaijani (some dialects)
    "dv", // Divehi
    "ku", // Kurdish
    "ps", // Pashto
    "sd", // Sindhi
    "ug", // Uyghur
  ];

  const lang = language.toLowerCase().split("-")[0];
  return rtlLanguages.includes(lang) ? "rtl" : "ltr";
};

/**
 * RTL Provider component
 * Wraps the app to provide RTL context and set document direction
 */
export const RTLProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [direction, setDirection] = React.useState<Direction>("ltr");

  useEffect(() => {
    // Detect initial language from i18next or browser
    const detectLanguage = () => {
      try {
        // Try to get from i18next if available
        const i18n = (window as any).i18next;
        if (i18n) {
          const currentLang = i18n.language || i18n.languages?.[0] || "en";
          return currentLang;
        }
      } catch (error) {
        console.warn("i18next not available for RTL detection");
      }

      // Fallback to navigator language
      return navigator.language || "en";
    };

    const language = detectLanguage();
    const dir = getDirectionFromLanguage(language);
    setDirection(dir);

    // Set document direction
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, []);

  // Listen for language changes if i18next is available
  useEffect(() => {
    try {
      const i18n = (window as any).i18next;
      if (i18n) {
        const handleLanguageChange = (lng: string) => {
          const dir = getDirectionFromLanguage(lng);
          setDirection(dir);
          document.documentElement.dir = dir;
          document.documentElement.lang = lng;
        };

        i18n.on("languageChanged", handleLanguageChange);

        return () => {
          i18n.off("languageChanged", handleLanguageChange);
        };
      }
    } catch (error) {
      // i18next not available, ignore
    }
  }, []);

  const value: RTLContextType = {
    direction,
    isRTL: direction === "rtl",
  };

  return <RTLContext.Provider value={value}>{children}</RTLContext.Provider>;
};

/**
 * Utility function to get RTL-aware styles
 */
export const getRTLStyles = (
  ltrStyles: React.CSSProperties,
  rtlStyles?: React.CSSProperties,
): React.CSSProperties => {
  const { isRTL } = useRTL();
  return isRTL ? rtlStyles || ltrStyles : ltrStyles;
};

/**
 * Utility function to get RTL-aware class names
 */
export const getRTLClass = (ltrClass: string, rtlClass?: string): string => {
  const { isRTL } = useRTL();
  return isRTL ? rtlClass || ltrClass : ltrClass;
};
