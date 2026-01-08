import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { visualizer } from "rollup-plugin-visualizer";
import { ViteImageOptimize } from "vite-plugin-image-optimize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - generates stats.html on build
    visualizer({
      filename: "stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    // Image optimization
    ViteImageOptimize({
      png: { quality: 80 },
      jpg: { quality: 80 },
      webp: { quality: 85 },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    target: "esnext",
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React ecosystem - keep core small
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/")
          ) {
            return "react-core";
          }

          // React Router - separate chunk
          if (id.includes("node_modules/react-router")) {
            return "react-router";
          }

          // State management
          if (
            id.includes("node_modules/zustand") ||
            id.includes("node_modules/@tanstack/react-query")
          ) {
            return "state";
          }

          // UI Framework - Radix, CVA, etc.
          if (
            id.includes("node_modules/@radix-ui") ||
            id.includes("node_modules/class-variance-authority") ||
            id.includes("node_modules/clsx") ||
            id.includes("node_modules/tailwind-merge")
          ) {
            return "ui-vendor";
          }

          // Animation library
          if (id.includes("node_modules/framer-motion")) {
            return "animation";
          }

          // Icons
          if (id.includes("node_modules/lucide-react")) {
            return "icons";
          }

          // Charts - further split vendor chunks
          if (id.includes("node_modules/recharts")) {
            return "recharts-vendor";
          }
          if (id.includes("node_modules/d3")) {
            return "d3-vendor";
          }

          // Maps - lazy load
          if (
            id.includes("node_modules/maplibre") ||
            id.includes("node_modules/react-map-gl") ||
            id.includes("node_modules/mapbox")
          ) {
            return "map-vendor";
          }

          // PDF - lazy load
          if (
            id.includes("node_modules/react-pdf") ||
            id.includes("node_modules/pdfjs-dist")
          ) {
            return "pdf-vendor";
          }

          // 3D Graphics - lazy load
          if (
            id.includes("node_modules/three") ||
            id.includes("node_modules/@react-three")
          ) {
            return "3d-vendor";
          }

          // Split recharts components for smaller chunks
          if (id.includes("node_modules/recharts/lib/component/")) {
            return "recharts-components";
          }
          if (id.includes("node_modules/recharts/lib/cartesian/")) {
            return "recharts-cartesian";
          }
          if (id.includes("node_modules/recharts/lib/polar/")) {
            return "recharts-polar";
          }
          if (id.includes("node_modules/d3")) {
            return "d3-vendor";
          }

          // Additional performance optimizations
          if (id.includes("node_modules/@tanstack/react-query")) {
            return "react-query";
          }
          if (id.includes("node_modules/zustand")) {
            return "zustand";
          }
          if (id.includes("node_modules/framer-motion")) {
            return "framer-motion";
          }

          // Graph visualization
          if (id.includes("node_modules/react-force-graph")) {
            return "graph-vendor";
          }

          // Form utilities
          if (
            id.includes("node_modules/zod") ||
            id.includes("node_modules/react-hook-form")
          ) {
            return "forms";
          }

          // Data grid and tables
          if (
            id.includes("node_modules/@tanstack/react-virtual") ||
            id.includes("node_modules/react-window") ||
            id.includes("node_modules/@dnd-kit")
          ) {
            return "data-grid";
          }

          // i18n
          if (id.includes("node_modules/i18next")) {
            return "i18n";
          }

          // HTTP client
          if (id.includes("node_modules/axios")) {
            return "http";
          }

          // Utility libraries
          if (
            id.includes("node_modules/lodash") ||
            id.includes("node_modules/date-fns") ||
            id.includes("node_modules/uuid")
          ) {
            return "utils-vendor";
          }

          // Keep other node_modules in a separate chunk
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
    // Enable source maps for debugging in production
    sourcemap: false,
    // Optimize CSS
    cssCodeSplit: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "zustand",
      "@tanstack/react-query",
    ],
    exclude: [
      // Exclude heavy deps that we want to lazy load
      "pdfjs-dist",
      "three",
    ],
  },
});
