/**
 * Internationalization Formatting Utilities
 * Uses native Intl APIs for locale-aware formatting
 */

// Default locale and timezone
const DEFAULT_LOCALE = "en-US";
const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Get the current locale settings from localStorage or defaults
 */
export const getLocaleSettings = (): { locale: string; timezone: string } => {
  if (typeof window === "undefined") {
    return { locale: DEFAULT_LOCALE, timezone: DEFAULT_TIMEZONE };
  }

  const stored = localStorage.getItem("localeSettings");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { locale: DEFAULT_LOCALE, timezone: DEFAULT_TIMEZONE };
    }
  }
  return { locale: DEFAULT_LOCALE, timezone: DEFAULT_TIMEZONE };
};

/**
 * Format currency with locale-aware formatting
 * Uses the currency from the data (data-driven)
 */
export const formatCurrency = (
  amount: number,
  currency: string = "USD",
  locale?: string,
): string => {
  const { locale: defaultLocale } = getLocaleSettings();
  const targetLocale = locale || defaultLocale;

  try {
    return new Intl.NumberFormat(targetLocale, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback for invalid currency codes
    return `${currency} ${amount.toFixed(2)}`;
  }
};

/**
 * Format date only (no time) with locale-aware formatting
 */
export const formatDate = (
  date: string | Date | number,
  options?: {
    locale?: string;
    timezone?: string;
    format?: "short" | "medium" | "long" | "full";
  },
): string => {
  const { locale: defaultLocale, timezone: defaultTimezone } =
    getLocaleSettings();
  const targetLocale = options?.locale || defaultLocale;
  const targetTimezone = options?.timezone || defaultTimezone;

  const dateObj =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
  }

  const formatMap: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: "numeric", day: "numeric", year: "2-digit" },
    medium: { month: "short", day: "numeric", year: "numeric" },
    long: { month: "long", day: "numeric", year: "numeric" },
    full: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
  };

  const formatOptions = formatMap[options?.format || "medium"];

  return new Intl.DateTimeFormat(targetLocale, {
    ...formatOptions,
    timeZone: targetTimezone,
  }).format(dateObj);
};

/**
 * Format date and time with locale-aware formatting
 */
export const formatDateTime = (
  date: string | Date | number,
  options?: {
    locale?: string;
    timezone?: string;
    includeSeconds?: boolean;
  },
): string => {
  const { locale: defaultLocale, timezone: defaultTimezone } =
    getLocaleSettings();
  const targetLocale = options?.locale || defaultLocale;
  const targetTimezone = options?.timezone || defaultTimezone;

  const dateObj =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(targetLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: options?.includeSeconds ? "2-digit" : undefined,
    timeZone: targetTimezone,
    hour12: targetLocale.startsWith("en"),
  }).format(dateObj);
};

/**
 * Format time only with locale-aware formatting
 */
export const formatTime = (
  date: string | Date | number,
  options?: {
    locale?: string;
    timezone?: string;
    includeSeconds?: boolean;
  },
): string => {
  const { locale: defaultLocale, timezone: defaultTimezone } =
    getLocaleSettings();
  const targetLocale = options?.locale || defaultLocale;
  const targetTimezone = options?.timezone || defaultTimezone;

  const dateObj =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

  if (isNaN(dateObj.getTime())) {
    return "Invalid time";
  }

  return new Intl.DateTimeFormat(targetLocale, {
    hour: "numeric",
    minute: "2-digit",
    second: options?.includeSeconds ? "2-digit" : undefined,
    timeZone: targetTimezone,
    hour12: targetLocale.startsWith("en"),
  }).format(dateObj);
};

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export const formatRelativeTime = (
  date: string | Date | number,
  locale?: string,
): string => {
  const { locale: defaultLocale } = getLocaleSettings();
  const targetLocale = locale || defaultLocale;

  const dateObj =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
  }

  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffWeek = Math.round(diffDay / 7);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  const rtf = new Intl.RelativeTimeFormat(targetLocale, { numeric: "auto" });

  if (Math.abs(diffSec) < 60) {
    return rtf.format(diffSec, "second");
  } else if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, "minute");
  } else if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, "hour");
  } else if (Math.abs(diffDay) < 7) {
    return rtf.format(diffDay, "day");
  } else if (Math.abs(diffWeek) < 4) {
    return rtf.format(diffWeek, "week");
  } else if (Math.abs(diffMonth) < 12) {
    return rtf.format(diffMonth, "month");
  } else {
    return rtf.format(diffYear, "year");
  }
};

/**
 * Format a number with locale-aware formatting
 */
export const formatNumber = (
  value: number,
  options?: {
    locale?: string;
    decimals?: number;
    style?: "decimal" | "percent";
  },
): string => {
  const { locale: defaultLocale } = getLocaleSettings();
  const targetLocale = options?.locale || defaultLocale;

  return new Intl.NumberFormat(targetLocale, {
    style: options?.style || "decimal",
    minimumFractionDigits: options?.decimals ?? 0,
    maximumFractionDigits: options?.decimals ?? 2,
  }).format(value);
};

/**
 * Get list of common timezones for settings dropdown
 */
export const getCommonTimezones = (): string[] => {
  try {
    // Get all supported timezones - cast to avoid TS error on older lib versions
    const intlAny = Intl as { supportedValuesOf?: (key: string) => string[] };
    if (intlAny.supportedValuesOf) {
      const allTimezones = intlAny.supportedValuesOf("timeZone");

      // Filter to common/useful ones
      const commonPrefixes = [
        "America/",
        "Europe/",
        "Asia/",
        "Australia/",
        "Pacific/",
        "Africa/",
      ];

      return allTimezones
        .filter(
          (tz: string) =>
            commonPrefixes.some((prefix) => tz.startsWith(prefix)) ||
            tz === "UTC",
        )
        .sort();
    }
    throw new Error("supportedValuesOf not available");
  } catch {
    // Fallback for older browsers
    return [
      "UTC",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Sao_Paulo",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Asia/Singapore",
      "Asia/Dubai",
      "Australia/Sydney",
      "Pacific/Auckland",
    ];
  }
};

/**
 * Get browser's detected timezone
 */
export const getBrowserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};
