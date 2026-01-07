/**
 * Zenith Frontend - Barrel Exports
 * Centralized re-exports for cleaner imports throughout the codebase
 */

// UI Components
export * from "./components/ui/Button";
export * from "./components/ui/Card";
export * from "./components/ui/Input";
export * from "./components/ui/Badge";
export * from "./components/ui/Dialog";
export * from "./components/ui/Select";

export * from "./components/ui/Avatar";
export * from "./components/ui/Progress";
export * from "./components/ui/Table";
export * from "./components/ui/Tabs";
export * from "./components/ui/Switch";
export * from "./components/ui/Label";
export * from "./components/ui/Skeleton";
export * from "./components/ui/ErrorBoundary";

// Layout Components
export * from "./components/layout/Header";
export * from "./components/layout/Sidebar";

// Pages
export * from "./pages/Dashboard";
export * from "./pages/Cases";
export * from "./pages/Login";

// Hooks
export * from "./hooks/useAuth";

// Stores
export * from "./store/authStore";

// Types
export * from "./types/schema";
export * from "./types/api";
export * from "./types/api-responses";

// Lib
export * from "./lib/api";
export * from "./lib/utils";
export * from "./lib/formatters";

// Services
export * from "./services/client";
