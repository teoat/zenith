import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "@jest/globals";
import React from "react";

// Export React globally for JSX
global.React = React;

// Mock React before any imports
jest.mock("react", () => {
  const React = jest.requireActual("react");
  return {
    ...React,
    Suspense: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Clean up after each test
afterEach(() => {
  cleanup();
});

// ResizeObserver mock
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// IntersectionObserver mock
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;

// TextEncoder/Decoder polyfill
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;
// @ts-expect-error - TextDecoder type mismatch
global.TextDecoder = TextDecoder;

// TransformStream polyfill
if (typeof global.TransformStream === "undefined") {
  Object.defineProperty(global, "TransformStream", {
    value: class TransformStream {},
    writable: true,
  });
}

// Enhanced fetch mock
global.fetch = jest.fn((_url: string, _options?: RequestInit) => {
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers(),
    json: async () => ({}),
    text: async () => "",
    blob: async () => new Blob(),
    arrayBuffer: async () => new ArrayBuffer(0),
    clone: function () {
      return this;
    },
  });
}) as jest.Mock;

// Basic Web API polyfills
if (typeof global.Request === "undefined") {
  Object.defineProperty(global, "Request", {
    value: function (_url: string, _options?: RequestInit) {
      this.url = _url;
      this.method = _options?.method || "GET";
      this.headers = _options?.headers || {};
    },
    writable: true,
  });
}

if (typeof global.Response === "undefined") {
  Object.defineProperty(global, "Response", {
    value: function (body?: unknown, options?: ResponseInit) {
      this.ok = options?.status
        ? options.status >= 200 && options.status < 300
        : true;
      this.status = options?.status || 200;
      this.statusText = options?.statusText || "OK";
      this.headers = options?.headers || {};
      this.body = body;
      this.json = () => Promise.resolve(body);
      this.text = () => Promise.resolve(JSON.stringify(body));
    },
    writable: true,
  });
}

if (typeof global.Headers === "undefined") {
  Object.defineProperty(global, "Headers", {
    value: function (init?: Record<string, string>) {
      this._headers = new Map<string, string>();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value);
        });
      }
      this.get = (name: string) => this._headers.get(name.toLowerCase());
      this.set = (name: string, value: string) =>
        this._headers.set(name.toLowerCase(), value);
    },
    writable: true,
  });
}

// Crypto polyfill for UUID generation
import crypto from "crypto";

Object.defineProperty(global, "crypto", {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      const bytes = crypto.randomBytes(arr.length);
      arr.set(bytes);
      return arr;
    },
    randomUUID: () => crypto.randomUUID(),
  },
});

// UUID v4 mock for secureLogger and other utilities
global.uuidv4 = () => crypto.randomUUID();

// localStorage mock
const localStorageMock = {
  getItem: jest.fn((_key: string) => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn((_index: number) => null),
};
global.localStorage = localStorageMock as unknown as Storage;

// sessionStorage mock
global.sessionStorage = localStorageMock as unknown as Storage;

// matchMedia mock
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Import.meta.env mock for Vite - handled via src/utils/env.ts helper
// and dynamic Function call during runtime to avoid parser errors.

// Mock components that use import.meta.env
jest.mock("../features/dashboard/components/ThreatMap", () => ({
  __esModule: true,
  default: () =>
    React.createElement("div", { "data-testid": "threat-map" }, "Threat Map"),
}));

// Suppress console errors in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
