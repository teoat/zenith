// Frontend Build Optimization Configuration
// Optimizes bundle size, implements code splitting, and improves loading performance

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh for development
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
    }),
    
    // Bundle size visualization
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    
    // Gzip compression
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    
    // Brotli compression (better than gzip)
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  
  build: {
    // Output directory
    outDir: 'dist',
    
    // Generate sourcemaps for production debugging
    sourcemap: true,
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500, // KB
    
    // Rollup options for optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom',  'react-router-dom'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
          'chart-vendor': ['recharts', 'd3'],
          'map-vendor': ['leaflet', 'react-leaflet'],
          
          // Application chunks
          'auth': [
            './src/contexts/AuthContext.tsx',
            './src/hooks/useAuth.ts',
          ],
          'dashboard': ['./src/pages/Dashboard.tsx'],
          'cases': ['./src/pages/Cases.tsx'],
          'network': ['./src/pages/NetworkAnalysis.tsx'],
        },
        
        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        
        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'], // Remove specific console methods
      },
      format: {
        comments: false, // Remove comments
      },
    },
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Inline assets smaller than 4kb
    assetsInlineLimit: 4096,
  },
  
  // Optimizations
  optimizeDeps: {
   include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@headlessui/react',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
  
  // Server configuration
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    hmr: {
      overlay: true,
    },
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@utils': '/src/utils',
      '@hooks': '/src/hooks',
      '@contexts': '/src/contexts',
      '@services': '/src/services',
      '@types': '/src/types',
    },
  },
  
  // Performance hints
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    treeShaking: true,
  },
});
