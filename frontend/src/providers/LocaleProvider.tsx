/**
 * LocaleProvider - Internationalization Context
 * Provides locale, timezone, and currency settings throughout the app
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getBrowserTimezone } from '@/lib/formatters';
import type {
  SupportedLocale,
  LocaleSettings
} from '@/types/locale';

interface LocaleContextType {
  settings: LocaleSettings;
  setLocale: (locale: SupportedLocale) => void;
  setTimezone: (timezone: string) => void;
  setDateFormat: (format: 'short' | 'medium' | 'long') => void;
  updateSettings: (updates: Partial<LocaleSettings>) => void;
}

const DEFAULT_SETTINGS: LocaleSettings = {
  locale: 'en-US',
  timezone: getBrowserTimezone(),
  dateFormat: 'medium',
};

const STORAGE_KEY = 'localeSettings';

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();

  const [settings, setSettings] = useState<LocaleSettings>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...DEFAULT_SETTINGS, ...parsed };
        }
      } catch {
        // Invalid stored data, use defaults
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Persist to localStorage whenever settings change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings]);

  // Sync i18n language with locale settings
  useEffect(() => {
    i18n.changeLanguage(settings.locale);
  }, [settings.locale, i18n]);

  const setLocale = useCallback((locale: SupportedLocale) => {
    setSettings(prev => ({ ...prev, locale }));
  }, []);

  const setTimezone = useCallback((timezone: string) => {
    setSettings(prev => ({ ...prev, timezone }));
  }, []);

  const setDateFormat = useCallback((dateFormat: 'short' | 'medium' | 'long') => {
    setSettings(prev => ({ ...prev, dateFormat }));
  }, []);

  const updateSettings = useCallback((updates: Partial<LocaleSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const value = useMemo(() => ({
    settings,
    setLocale,
    setTimezone,
    setDateFormat,
    updateSettings,
  }), [settings, setLocale, setTimezone, setDateFormat, updateSettings]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
};

/**
 * Hook to access locale settings and update functions
 */
export const useLocale = (): LocaleContextType => {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};

/**
 * Hook for formatting functions with current locale settings
 */
export const useFormatters = () => {
  const { settings } = useLocale();
  
  return useMemo(() => ({
    /**
     * Format currency with data-driven currency code
     */
    formatCurrency: (amount: number, currency: string = 'USD'): string => {
      try {
        return new Intl.NumberFormat(settings.locale, {
          style: 'currency',
          currency: currency.toUpperCase(),
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
      } catch {
        return `${currency} ${amount.toFixed(2)}`;
      }
    },
    
    /**
     * Format date with locale and timezone settings
     */
    formatDate: (date: string | Date | number): string => {
      const dateObj = typeof date === 'string' || typeof date === 'number' 
        ? new Date(date) 
        : date;
      
      if (isNaN(dateObj.getTime())) return 'Invalid date';
      
      const formatMap: Record<string, Intl.DateTimeFormatOptions> = {
        short: { month: 'numeric', day: 'numeric', year: '2-digit' },
        medium: { month: 'short', day: 'numeric', year: 'numeric' },
        long: { month: 'long', day: 'numeric', year: 'numeric' },
      };
      
      return new Intl.DateTimeFormat(settings.locale, {
        ...formatMap[settings.dateFormat],
        timeZone: settings.timezone,
      }).format(dateObj);
    },
    
    /**
     * Format date and time with locale and timezone settings
     */
    formatDateTime: (date: string | Date | number, includeSeconds = false): string => {
      const dateObj = typeof date === 'string' || typeof date === 'number' 
        ? new Date(date) 
        : date;
      
      if (isNaN(dateObj.getTime())) return 'Invalid date';
      
      return new Intl.DateTimeFormat(settings.locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: includeSeconds ? '2-digit' : undefined,
        timeZone: settings.timezone,
        hour12: settings.locale.startsWith('en'),
      }).format(dateObj);
    },
    
    /**
     * Format time only
     */
    formatTime: (date: string | Date | number, includeSeconds = false): string => {
      const dateObj = typeof date === 'string' || typeof date === 'number' 
        ? new Date(date) 
        : date;
      
      if (isNaN(dateObj.getTime())) return 'Invalid time';
      
      return new Intl.DateTimeFormat(settings.locale, {
        hour: 'numeric',
        minute: '2-digit',
        second: includeSeconds ? '2-digit' : undefined,
        timeZone: settings.timezone,
        hour12: settings.locale.startsWith('en'),
      }).format(dateObj);
    },
    
    /**
     * Format relative time
     */
    formatRelativeTime: (date: string | Date | number): string => {
      const dateObj = typeof date === 'string' || typeof date === 'number' 
        ? new Date(date) 
        : date;
      
      if (isNaN(dateObj.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffMs = dateObj.getTime() - now.getTime();
      const diffMin = Math.round(diffMs / 60000);
      const diffHour = Math.round(diffMin / 60);
      const diffDay = Math.round(diffHour / 24);
      
      const rtf = new Intl.RelativeTimeFormat(settings.locale, { numeric: 'auto' });
      
      if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
      if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
      return rtf.format(diffDay, 'day');
    },
    
    /**
     * Format number with locale settings
     */
    formatNumber: (value: number, decimals = 0): string => {
      return new Intl.NumberFormat(settings.locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    },
  }), [settings]);
};

export default LocaleProvider;
