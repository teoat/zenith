/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare global {
  namespace Vi {
    interface JestAssertion<T = any> extends TestingLibraryMatchers<T, void> {}
  }
}

// Global environment variables for Vite
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_MAPBOX_TOKEN: string
  readonly VITE_ENABLE_THREAT_MAP: string
  readonly VITE_ENABLE_ADVANCED_FORENSIC: string
  readonly VITE_USE_SIMPLE_PDF_VIEWER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

export {}
