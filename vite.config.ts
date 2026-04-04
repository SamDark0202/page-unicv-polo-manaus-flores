import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/cursos-tecnicos": {
        target: "https://diariodebordo.unicv.edu.br",
        changeOrigin: true,
        secure: true,
        rewrite: () => "/cursos-tecnicos/publico",
      },
      "/api/segunda-graduacao": {
        target: "https://diariodebordo.unicv.edu.br",
        changeOrigin: true,
        secure: true,
        rewrite: () => "/cursos-segunda-graduacao/publico",
      },
    },
  },
  build: {
    target: "ES2020",
    minify: "esbuild",
    chunkSizeWarningLimit: 1000,
    sourcemap: mode === "development",
    rollupOptions: {
      output: {
        manualChunks: {
          "react-core": [
            "react",
            "react-dom",
            "react-router-dom",
          ],
          "radix-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-accordion",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-slot",
            "@radix-ui/react-alert-dialog",
          ],
          "data-fetching": [
            "@tanstack/react-query",
            "@supabase/supabase-js",
          ],
        },
        entryFileNames: "js/[name]-[hash].js",
        chunkFileNames: "js/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
