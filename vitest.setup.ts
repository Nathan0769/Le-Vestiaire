import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { config } from "dotenv";
import { resolve } from "path";
import { testDatabaseError } from "./__tests__/helpers/test-database-guard";

config({ path: resolve(__dirname, ".env") });
config({ path: resolve(__dirname, ".env.test"), override: true });
// Force DATABASE_URL vers la DB de dev pour tous les imports dans les routes.
// Comparé à DATABASE_URL avant l'écrasement : après, on ne peut plus savoir
// si la base de dev est en fait la prod.
if (process.env.DATABASE_URL_DEV) {
  const unsafe = testDatabaseError(process.env.DATABASE_URL_DEV, process.env.DATABASE_URL);
  if (unsafe) throw new Error(`DANGER: ${unsafe} Tests arrêtés.`);
  process.env.DATABASE_URL = process.env.DATABASE_URL_DEV;
}

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
