import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from '@jest/globals';

// Mock import.meta
Object.defineProperty(window, 'import', {
  writable: true,
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:8000/api/v1',
        VITE_MAPBOX_TOKEN: 'test-token',
        VITE_ENABLE_THREAT_MAP: 'true',
        VITE_ENABLE_ADVANCED_FORENSIC: 'true',
        VITE_USE_SIMPLE_PDF_VIEWER: 'false'
      }
    }
  }
});

// ResizeObserver mock
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// TextEncoder/Decoder polyfill
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
// @ts-expect-error - TextDecoder type mismatch
global.TextDecoder = TextDecoder;

// Clean up after each test
afterEach(() => {
  cleanup();
});