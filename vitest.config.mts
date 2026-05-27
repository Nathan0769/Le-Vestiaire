import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig(({}) => ({
  // Charger les variables d'environnement de test
  envDir: ".",
  envPrefix: ["VITE_", "NEXT_PUBLIC_", "KV_", "DATABASE_", "BETTER_AUTH_"],
  plugins: [
    react(),
    tsconfigPaths(), // Support pour les alias @/*
  ],
  test: {
    // Environnement DOM pour les tests React
    environment: "jsdom",

    // Globals
    globals: true,

    // Setup files
    setupFiles: ["./vitest.setup.ts"],

    // Désactiver le parallélisme des fichiers pour les tests d'intégration
    fileParallelism: false,

    // Timeout élevé pour les tests d'intégration (requêtes DB + rate limit Upstash indisponible)
    testTimeout: 30000,

    // Pattern des fichiers de test
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],

    // Exclure node_modules et .next
    exclude: ["node_modules", ".next", "dist", "build"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        ".next/",
        "dist/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData",
        "tests/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
}));
