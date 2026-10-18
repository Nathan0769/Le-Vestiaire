import { describe, it, expect } from "vitest";
import { testDatabaseError } from "@/__tests__/helpers/test-database-guard";

const DEV = "postgresql://u:p@ep-dev-db-123456-pooler.c-2.eu-central-1.aws.neon.tech/neondb";
const PROD = "postgresql://u:p@ep-prod-db-654321-pooler.c-2.eu-central-1.aws.neon.tech/neondb";

describe("testDatabaseError", () => {
  it("accepte une base de dev distincte de la prod", () => {
    expect(testDatabaseError(DEV, PROD)).toBeNull();
  });

  it("refuse l'absence de base de dev", () => {
    expect(testDatabaseError(undefined, PROD)).toMatch(/DATABASE_URL_DEV/);
  });

  it("refuse une URL illisible", () => {
    expect(testDatabaseError("pas une url", PROD)).toMatch(/illisible/);
  });

  it("refuse la même base que DATABASE_URL", () => {
    expect(testDatabaseError(PROD, PROD)).toMatch(/prod/);
  });

  it("refuse le même endpoint Neon via l'hôte direct au lieu du pooler", () => {
    const direct = "postgresql://u:p@ep-prod-db-654321.c-2.eu-central-1.aws.neon.tech/neondb";
    expect(testDatabaseError(direct, PROD)).toMatch(/prod/);
  });

  it("refuse l'endpoint de prod connu même sans DATABASE_URL", () => {
    const prod = "postgresql://u:p@ep-polished-voice-agyx1myp-pooler.c-2.eu-central-1.aws.neon.tech/neondb";
    expect(testDatabaseError(prod, undefined)).toMatch(/prod/);
  });
});
