
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { visualizer } from 'rollup-plugin-visualizer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - generates stats.html on build
    visualizer({
      filename: 'stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core - keep together
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          
          // State management
          'state': ['zustand', '@tanstack/react-query'],
          
          // UI frameworks - separate chunk
          'ui-framework': ['framer-motion', 'lucide-react'],
          
          // Heavy visualization libs - lazy load these
          'charts': ['recharts', 'chart.js', 'react-chartjs-2'],
          'maps': ['leaflet', 'react-leaflet'],
          'pdf': ['pdfjs-dist', 'react-pdf'],
          '3d': ['three', '@react-three/fiber', '@react-three/drei'],
          
          // Utilities
          'utils': ['date-fns', 'lodash-es', 'uuid'],
        },
      },
    },
  },
})
