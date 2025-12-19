import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Aggressive chunking for bundle size reduction - only load heavy libs when needed
          if (id.includes('node_modules')) {
            // Heavy visualization libraries - lazy load these
            if (id.includes('react-force-graph') || id.includes('three') || id.includes('react-force-graph-3d')) {
              return 'viz-heavy';
            }
            if (id.includes('maplibre-gl') || id.includes('react-map-gl') || id.includes('mapbox-gl')) {
              return 'map-vendor';
            }
            if (id.includes('recharts') || id.includes('d3') || id.includes('chart.js') || id.includes('plotly.js')) {
              return 'chart-vendor';
            }
            if (id.includes('react-pdf') || id.includes('pdfjs-dist') || id.includes('react-pdf-highlighter')) {
              return 'pdf-vendor';
            }

            // Core React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-core';
            }

            // UI libraries - keep together for better caching
            if (id.includes('@radix-ui') || id.includes('@headlessui') || id.includes('lucide-react') ||
                id.includes('framer-motion') || id.includes('tailwindcss')) {
              return 'ui-vendor';
            }

            // Data fetching and state
            if (id.includes('@tanstack/react-query') || id.includes('axios') || id.includes('zustand')) {
              return 'data-vendor';
            }

            // Utilities
            if (id.includes('lodash') || id.includes('date-fns') || id.includes('clsx') ||
                id.includes('class-variance-authority') || id.includes('uuid')) {
              return 'utils-vendor';
            }

            // Form handling and validation
            if (id.includes('zod') || id.includes('react-hook-form')) {
              return 'forms-vendor';
            }

            // Other vendor libraries
            return 'vendor';
          }

          // Application chunks - split by feature domains
          if (id.includes('ForensicCanvas') || id.includes('TamperDetector') || id.includes('MensReaAnalyzer')) {
            return 'forensics';
          }
          if (id.includes('ThreatMap') || id.includes('NetworkGraph') || id.includes('EntityGraph3D') ||
              id.includes('RelationshipGraph')) {
            return 'visualization';
          }
          if (id.includes('Dashboard') || id.includes('MovableDashboard')) {
            return 'dashboard';
          }
          if (id.includes('Reporting') || id.includes('ReportBuilder') || id.includes('FinancialHealth')) {
            return 'reporting';
          }
          if (id.includes('Cases') || id.includes('CaseKanban') || id.includes('Investigation')) {
            return 'cases';
          }
          if (id.includes('Settings') || id.includes('SystemDiagnosticsCenter')) {
            return 'settings';
          }
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk'
          return `assets/${facadeModuleId}-[hash].js`
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
    // Aggressive chunk size warning - target <500KB per chunk
    chunkSizeWarningLimit: 500,
    // Enable source maps for debugging (but compress them)
    sourcemap: false, // Disable for production to reduce size
    // Aggressive minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
        passes: 3, // Multiple passes for better compression
        unsafe: true, // Enable unsafe optimizations
        unsafe_comps: true,
        unsafe_Function: true,
        unsafe_math: true,
        unsafe_symbols: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Enable build reports for monitoring bundle size
    reportCompressedSize: true,
    // Optimize for production
    emptyOutDir: true,
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.cjs'],
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'lodash',
      'date-fns',
      'zustand',
      'zod',
      'clsx',
      'tailwind-merge',
    ],
    exclude: [], // No exclusions needed
    // Force include large libraries that benefit from pre-bundling
    force: true,
  },
  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@services': resolve(__dirname, './src/services'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@lib': resolve(__dirname, './src/lib'),
      '@types': resolve(__dirname, './src/types'),
    },
  },
  // Define environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
}))