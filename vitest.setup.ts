import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, ".env") });
config({ path: resolve(__dirname, ".env.test"), override: true });
// Utilise la DB de dev pour les tests d'intégration
if (process.env.DATABASE_URL_DEV) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_DEV;
}

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
