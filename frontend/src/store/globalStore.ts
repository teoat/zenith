import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

/**
 * Global application state store
 * Implements centralized state management with persistence and dev tools
 */

interface GlobalState {
  // UI State
  sidebarCollapsed: boolean;
  theme: "light" | "dark" | "system";
  locale: string;

  // User Preferences
  preferences: {
    defaultPageSize: number;
    enableAnimations: boolean;
    enableNotifications: boolean;
    showKeyboardShortcuts: boolean;
  };

  // Filter State (shared across pages)
  filters: {
    dateRange: { start: Date | null; end: Date | null };
    riskLevel: string[];
    status: string[];
    assignee: string | null;
  };

  // Loading States
  loading: {
    global: boolean;
    cases: boolean;
    transactions: boolean;
    ai: boolean;
  };

  // Error States
  errors: {
    global: Error | null;
    cases: Error | null;
    transactions: Error | null;
    ai: Error | null;
  };

  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setLocale: (locale: string) => void;
  updatePreferences: (preferences: Partial<GlobalState["preferences"]>) => void;
  updateFilters: (filters: Partial<GlobalState["filters"]>) => void;
  setLoading: (key: keyof GlobalState["loading"], value: boolean) => void;
  setError: (key: keyof GlobalState["errors"], error: Error | null) => void;
  clearErrors: () => void;
  reset: () => void;
}

const initialState = {
  sidebarCollapsed: false,
  theme: "system" as const,
  locale: "en-US",
  preferences: {
    defaultPageSize: 20,
    enableAnimations: true,
    enableNotifications: true,
    showKeyboardShortcuts: true,
  },
  filters: {
    dateRange: { start: null, end: null },
    riskLevel: [],
    status: [],
    assignee: null,
  },
  loading: {
    global: false,
    cases: false,
    transactions: false,
    ai: false,
  },
  errors: {
    global: null,
    cases: null,
    transactions: null,
    ai: null,
  },
};

export const useGlobalStore = create<GlobalState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setSidebarCollapsed: (collapsed) =>
          set({ sidebarCollapsed: collapsed }, false, "setSidebarCollapsed"),

        setTheme: (theme) => set({ theme }, false, "setTheme"),

        setLocale: (locale) => set({ locale }, false, "setLocale"),

        updatePreferences: (preferences) =>
          set(
            (state) => ({
              preferences: { ...state.preferences, ...preferences },
            }),
            false,
            "updatePreferences",
          ),

        updateFilters: (filters) =>
          set(
            (state) => ({
              filters: { ...state.filters, ...filters },
            }),
            false,
            "updateFilters",
          ),

        setLoading: (key, value) =>
          set(
            (state) => ({
              loading: { ...state.loading, [key]: value },
            }),
            false,
            "setLoading",
          ),

        setError: (key, error) =>
          set(
            (state) => ({
              errors: { ...state.errors, [key]: error },
            }),
            false,
            "setError",
          ),

        clearErrors: () =>
          set({ errors: initialState.errors }, false, "clearErrors"),

        reset: () => set(initialState, false, "reset"),
      }),
      {
        name: "global-store",
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          locale: state.locale,
          preferences: state.preferences,
        }),
      },
    ),
    { name: "GlobalStore" },
  ),
);

/**
 * Hooks for specific slices of state
 */

export const useSidebar = () => {
  const collapsed = useGlobalStore((state) => state.sidebarCollapsed);
  const setCollapsed = useGlobalStore((state) => state.setSidebarCollapsed);
  return { collapsed, setCollapsed };
};

export const useTheme = () => {
  const theme = useGlobalStore((state) => state.theme);
  const setTheme = useGlobalStore((state) => state.setTheme);
  return { theme, setTheme };
};

export const usePreferences = () => {
  const preferences = useGlobalStore((state) => state.preferences);
  const updatePreferences = useGlobalStore((state) => state.updatePreferences);
  return { preferences, updatePreferences };
};

export const useFilters = () => {
  const filters = useGlobalStore((state) => state.filters);
  const updateFilters = useGlobalStore((state) => state.updateFilters);
  return { filters, updateFilters };
};

export const useLoadingState = (key: keyof GlobalState["loading"]) => {
  const loading = useGlobalStore((state) => state.loading[key]);
  const setLoading = useGlobalStore((state) => state.setLoading);
  return {
    loading,
    setLoading: (value: boolean) => setLoading(key, value),
  };
};

export const useErrorState = (key: keyof GlobalState["errors"]) => {
  const error = useGlobalStore((state) => state.errors[key]);
  const setError = useGlobalStore((state) => state.setError);
  const clearErrors = useGlobalStore((state) => state.clearErrors);
  return {
    error,
    setError: (error: Error | null) => setError(key, error),
    clearErrors,
  };
};
