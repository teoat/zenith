module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(test).+(ts|tsx|js)'
  ],
   testPathIgnorePatterns: [
     '/node_modules/',
     '/e2e/',
     '/dist/',
     '/coverage/',
     '\\.spec\\.ts$',
     'react-mocks\\.js$'
   ],
   transformIgnorePatterns: [
     'node_modules/(?!(react-force-graph-2d|@react-spring|d3-*|internmap|react-kapsule)/)'
   ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/vite-env.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/main.tsx'
  ],
   coverageThreshold: {
     global: {
       statements: 20,
       branches: 15,
       functions: 20,
       lines: 20
     }
   },
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  moduleFileExtensions: ['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'd.ts', 'json', 'node'],
   moduleNameMapper: {
     '^@/(.*)$': '<rootDir>/src/$1',
     '\\.\\./types/electron$': '<rootDir>/src/types/electron.d.ts',
     '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
     '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/src/__mocks__/fileMock.js',
     '^react-force-graph-2d$': '<rootDir>/src/__mocks__/forceGraphMock.js'
   },
  transform: {
     '^.+\\.tsx?$': ['ts-jest', {
       tsconfig: {
         jsx: 'react',
         esModuleInterop: true,
         allowSyntheticDefaultImports: true
       },
       diagnostics: {
         ignoreCodes: [151001]
       }
     }]
   },
  testTimeout: 10000,
  maxWorkers: '50%'
};
