import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

const INTEGRATION_FILES = ["__tests__/integration/**/*.test.ts", "**/*.integration.test.ts"];
const UNIT_EXCLUDE = ["**/node_modules/**", ".next/**", "dist/**", "build/**"];

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

    // Exclure node_modules et .next
    exclude: ["node_modules", ".next", "dist", "build"],

    // unit : sans base, lancé au pre-push. integration : base de dev, en CI.
    // Un test qui touche la base vit dans __tests__/integration ou s'appelle
    // *.integration.test.ts ; sinon helpers/db le refuse en projet unit.
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
          exclude: [...UNIT_EXCLUDE, ...INTEGRATION_FILES],
          env: { VITEST_PROJECT: "unit" },
        },
      },
      {
        extends: true,
        test: { name: "integration", include: INTEGRATION_FILES },
      },
    ],

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
