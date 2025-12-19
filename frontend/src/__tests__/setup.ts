// Mock React before any imports
jest.mock('react', () => {
  const React = jest.requireActual('react');
  return {
    ...React,
    lazy: (factory: any) => factory(),
    Suspense: ({ children }: any) => children,
  };
});

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from '@jest/globals';

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

// TextEncoder/Decoder polyfill
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;
// @ts-expect-error - TextDecoder type mismatch
global.TextDecoder = TextDecoder;

// Simplified polyfills for test environment compatibility
// These are minimal implementations to avoid TypeScript conflicts

// TransformStream polyfill
if (typeof global.TransformStream === 'undefined') {
  Object.defineProperty(global, 'TransformStream', {
    value: class TransformStream {},
    writable: true,
  });
}

// Basic Web API polyfills (avoiding TypeScript conflicts)
if (typeof global.Request === 'undefined') {
  Object.defineProperty(global, 'Request', {
    value: function(url: string, options?: any) {
      this.url = url;
      this.method = options?.method || 'GET';
      this.headers = options?.headers || {};
    },
    writable: true,
  });
}

if (typeof global.Response === 'undefined') {
  Object.defineProperty(global, 'Response', {
    value: function(body?: any, options?: any) {
      this.ok = options?.status ? options.status >= 200 && options.status < 300 : true;
      this.status = options?.status || 200;
      this.statusText = options?.statusText || 'OK';
      this.headers = options?.headers || {};
      this.body = body;
      this.json = () => Promise.resolve(body);
      this.text = () => Promise.resolve(JSON.stringify(body));
    },
    writable: true,
  });
}

if (typeof global.Headers === 'undefined') {
  Object.defineProperty(global, 'Headers', {
    value: function(init?: any) {
      this._headers = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]: [string, any]) => {
          this._headers.set(key.toLowerCase(), value);
        });
      }
      this.get = (name: string) => this._headers.get(name.toLowerCase());
      this.set = (name: string, value: any) => this._headers.set(name.toLowerCase(), value);
    },
    writable: true,
  });
}

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Crypto polyfill for UUID generation
// eslint-disable-next-line @typescript-eslint/no-var-requires
const crypto = require('crypto');

Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {

      const bytes = crypto.randomBytes(arr.length);
      arr.set(bytes);
      return arr;
    },
    randomUUID: () => crypto.randomUUID()
  }
});
