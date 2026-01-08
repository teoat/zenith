// Global type extensions for project
declare global {
  interface Window {
    fetch: typeof fetch;
  }
}

/// <reference types="jest" />

// Test-specific extensions
interface Response {
  ok: boolean;
  status: number;
  headers: Record<string, string>;
  redirected: boolean;
  statusText: string;
  type: ResponseType;
}

interface ResponseType {
  default: string;
}

// Mock storage for tests
interface Storage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  length: number;
}

declare var localStorage: Storage;
declare var sessionStorage: Storage;

// Jest globals (minimal typing for compatibility)
declare var describe: any;
declare var it: any;
declare var test: any;
declare var expect: any;
declare var beforeEach: any;
declare var afterEach: any;