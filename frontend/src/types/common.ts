// Common types used across the application

// ============ ERROR TYPES ============
export interface BaseError {
  message: string;
  code?: string;
  status?: number;
  timestamp?: string;
}

export interface ApiError extends BaseError {
  status: number;
  endpoint?: string;
  method?: string;
  response?: {
    data?: unknown;
    status: number;
    statusText: string;
  };
}

export interface ValidationError extends BaseError {
  field?: string;
  value?: unknown;
}

export interface NetworkError extends BaseError {
  type: 'NetworkError' | 'TimeoutError' | 'AbortError';
  url?: string;
}

// ============ API RESPONSE TYPES ============
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: BaseError;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============ QUEUE TYPES ============
export interface QueueItem {
  id: string;
  type: string;
  data: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
  retryCount?: number;
  error?: BaseError;
}

// ============ ELECTRON API TYPES ============
export interface ElectronCallback {
  (...args: unknown[]): void;
}

export interface ElectronAPIEvents {
  'auth:changed': (isAuthenticated: boolean, user?: unknown) => void;
  'session:status': (status: { authenticated: boolean; expires?: number }) => void;
  'sync:progress': (progress: { completed: number; total: number }) => void;
  'notification': (notification: { title: string; body: string; type: string }) => void;
}

// ============ FORM TYPES ============
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: unknown) => string | undefined;
  };
  value?: unknown;
  error?: string;
}

export interface FormData {
  [key: string]: unknown;
}

// ============ FILE TYPES ============
export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

export interface ProcessingResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  metadata?: {
    processingTime: number;
    fileSize: number;
    fileType: string;
  };
}

// ============ WEBSOCKET TYPES ============
export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp: string;
  id?: string;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error?: BaseError;
  lastMessage?: WebSocketMessage;
  reconnectAttempts: number;
}

// ============ COMPONENT PROP TYPES ============
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  'data-testid'?: string;
}

export interface LoadingProps extends BaseComponentProps {
  isLoading?: boolean;
  loadingText?: string;
}

// ============ UTILITY TYPES ============
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// ============ STATUS TYPES ============
export type Status = 'idle' | 'loading' | 'success' | 'error';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Severity = 'info' | 'warning' | 'error' | 'critical';

// ============ CONFIGURATION TYPES ============
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  features: {
    enableRealTime: boolean;
    enableOfflineMode: boolean;
    enableAnalytics: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    animations: boolean;
  };
}
