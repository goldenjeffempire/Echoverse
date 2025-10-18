import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === "production" ? false : true,
    minify: "esbuild",
    target: "es2020",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "wouter"
          ],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-toast",
            "@radix-ui/react-tabs",
            "@radix-ui/react-accordion",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-switch",
            "@radix-ui/react-slider"
          ],
          charts: ["recharts"],
          stripe: ["@stripe/stripe-js", "@stripe/react-stripe-js"],
          utils: [
            "clsx",
            "class-variance-authority",
            "tailwind-merge",
            "date-fns",
            "zod"
          ]
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split("/").reverse()[0] : "chunk";
          return `assets/js/[name]-[hash].js`;
        },
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".");
          const ext = info?.[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext ?? "")) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/i.test(ext ?? "")) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    reportCompressedSize: true,
    cssMinify: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: false,
    // CRITICAL FIX: Allow all hosts for Replit proxy environment
    allowedHosts: true,
    // HMR runs through Express middleware - no separate port needed
    // The server/vite.ts configures HMR to use the same HTTP server
    hmr: {
      clientPort: 443,
      protocol: 'wss',
      host: process.env.REPLIT_DOMAINS?.split(',')[0] || undefined,
      overlay: true,
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    watch: {
      usePolling: true,
    },
  },
});
