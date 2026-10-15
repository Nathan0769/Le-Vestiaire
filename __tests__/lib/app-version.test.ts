import { describe, it, expect } from "vitest";
import { compareVersions, isUpdateRequired } from "@/lib/app-version";

describe("compareVersions", () => {
  it("compare les versions par morceaux numériques", () => {
    expect(compareVersions("1.10", "1.9")).toBe(1);
    expect(compareVersions("1.4", "1.5")).toBe(-1);
    expect(compareVersions("2.0", "1.12.3")).toBe(1);
  });

  it("considère 1.5 et 1.5.0 comme identiques", () => {
    expect(compareVersions("1.5", "1.5.0")).toBe(0);
  });

  it("retourne null pour une version illisible", () => {
    expect(compareVersions("1.x", "1.5")).toBeNull();
    expect(compareVersions("", "1.5")).toBeNull();
  });
});

describe("isUpdateRequired", () => {
  it("ne bloque jamais sans version minimale (cas normal)", () => {
    expect(isUpdateRequired("1.0", null)).toBe(false);
  });

  it("bloque une version sous le minimum", () => {
    expect(isUpdateRequired("1.5", "1.6")).toBe(true);
  });

  it("laisse passer le minimum et au-dessus", () => {
    expect(isUpdateRequired("1.6", "1.6")).toBe(false);
    expect(isUpdateRequired("1.10", "1.6")).toBe(false);
  });

  it("ne bloque jamais une version absente ou illisible", () => {
    expect(isUpdateRequired(null, "1.6")).toBe(false);
    expect(isUpdateRequired("beta", "1.6")).toBe(false);
  });
});
