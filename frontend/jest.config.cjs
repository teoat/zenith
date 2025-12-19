module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}'
    // E2E tests are handled by Playwright, not Jest
  ],

  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@dnd-kit|@radix-ui|@tanstack|lucide-react|@types)/)'
  ],
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^\\.+services/client$': '<rootDir>/src/services/__mocks__/client.ts',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/src/__mocks__/fileMock.js'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  // Improve error reporting
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,

  globals: {
    'import.meta': {
      env: {
        VITE_API_URL: 'http://localhost:8000/api/v1',
        VITE_MAPBOX_TOKEN: 'test-token',
        VITE_ENABLE_THREAT_MAP: 'true',
        VITE_ENABLE_ADVANCED_FORENSIC: 'true',
        VITE_USE_SIMPLE_PDF_VIEWER: 'false',
        MODE: 'test',
        DEV: false,
        PROD: false,
        SSR: false
      }
    }
  },

  // Test timeout
  testTimeout: 10000,

  // Error handling
  bail: 0, // Don't stop on first failure
  maxWorkers: '50%', // Use 50% of available cores

  // Additional reporters for CI
  ...(process.env.CI && {
    reporters: [
      'default',
      ['jest-junit', { outputDirectory: 'test-results', outputName: 'jest-junit.xml' }]
    ]
  })
};