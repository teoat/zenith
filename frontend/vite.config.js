import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({ jsxRuntime: "automatic" })],
  base: "./",
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(
        __dirname,
        "./node_modules/react/jsx-runtime",
      ),
      "react/jsx-dev-runtime": path.resolve(
        __dirname,
        "./node_modules/react/jsx-dev-runtime",
      ),
    },
  },
  build: {
    // Bundle optimization
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            if (id.includes("react-router")) {
              return "router-vendor";
            }
            if (
              id.includes("lucide") ||
              id.includes("radix") ||
              id.includes("class-variance") ||
              id.includes("clsx")
            ) {
              return "ui-vendor";
            }
            if (id.includes("@tanstack/react-query")) {
              return "query-vendor";
            }
            if (
              id.includes("react-force-graph") ||
              id.includes("d3") ||
              id.includes("recharts")
            ) {
              return "chart-vendor";
            }
            if (
              id.includes("axios") ||
              id.includes("zustand") ||
              id.includes("immer")
            ) {
              return "utils-vendor";
            }
            if (id.includes("maplibre") || id.includes("react-map-gl")) {
              return "map-vendor";
            }
            if (id.includes("pdf") || id.includes("react-pdf")) {
              return "pdf-vendor";
            }
            // Other large libraries
            if (id.includes("lodash") || id.includes("date-fns")) {
              return "utils-vendor";
            }
          }

          // Application chunks
          if (id.includes("src/pages/")) {
            return "pages";
          }
          if (id.includes("src/components/")) {
            return "components";
          }
          if (id.includes("src/services/")) {
            return "services";
          }
        },
      },
    },
    // Chunk size warnings - stricter limit
    chunkSizeWarningLimit: 500,
    // Source maps for production debugging
    sourcemap: false,
    // Minification
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "react-force-graph-2d",
    ],
  },
  // Development server optimizations
  server: {
    fs: {
      // Allow serving files from packages for development
      allow: ["../../"],
    },
  },
});
