import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Vitest configuration extending Vite setup
export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],
  
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global test setup
    globals: true,
    
    // Test file patterns
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e'],
    
    // Setup files
    setupFiles: ['./src/__tests__/setup.vitest.ts'],
    
    // Test timeout and isolation
    testTimeout: 10000,
    isolate: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'e2e/**',
        '**/*.d.ts',
        '**/config/**',
        '**/tests/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 75,
          statements: 75
        }
      }
    }
  },
  
  // Resolve configuration (inherited from vite.config.ts)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Define global constants for tests
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:8000/api/v1'),
    'import.meta.env.VITE_MAPBOX_TOKEN': JSON.stringify('test-token'),
    'import.meta.env.VITE_ENABLE_THREAT_MAP': JSON.stringify('true'),
    'import.meta.env.VITE_ENABLE_ADVANCED_FORENSIC': JSON.stringify('true'),
    'import.meta.env.VITE_USE_SIMPLE_PDF_VIEWER': JSON.stringify('false'),
  }
})
