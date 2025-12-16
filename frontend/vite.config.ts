import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate large libraries into their own chunks
          if (id.includes('node_modules')) {
            // Vendor chunks
            if (id.includes('mapbox-gl') || id.includes('react-map-gl')) {
              return 'mapbox-vendor';
            }
            if (id.includes('recharts') || id.includes('d3') || id.includes('react-force-graph-2d')) {
              return 'chart-vendor';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui') || id.includes('@headlessui') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            if (id.includes('@tanstack/react-query') || id.includes('axios')) {
              return 'query-vendor';
            }
            if (id.includes('lodash') || id.includes('date-fns') || id.includes('clsx') || id.includes('class-variance-authority')) {
              return 'core-vendor';
            }
            // Group other node_modules into vendor chunks
            return 'vendor';
          }

          // Split large application chunks
          if (id.includes('ForensicCanvas') || id.includes('TamperDetector') || id.includes('MensReaAnalyzer')) {
            return 'forensics-core';
          }
          if (id.includes('ThreatMap') || id.includes('NetworkGraph') || id.includes('EntityGraph3D')) {
            return 'visualization-heavy';
          }
          if (id.includes('Reporting') || id.includes('Dashboard') || id.includes('Cases')) {
            return 'pages-heavy';
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
    // Increase chunk size warning limit since we're optimizing
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: false, // Disable for production to reduce size
    // Minify for smaller bundles
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    // Target modern browsers for smaller bundles
    target: 'es2020',
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
    ],
    exclude: ['mapbox-gl'], // Exclude from pre-bundling to enable lazy loading
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
})