import { describe, it, expect } from "vitest";
import { normalizeClubName } from "@/lib/partner-shops/club-name";

describe("normalizeClubName", () => {
  it("retire les accents et la casse", () => {
    expect(normalizeClubName("Arménie")).toBe("armenie");
  });

  it("remplace la ponctuation par des espaces", () => {
    expect(normalizeClubName("Bosnie-Herzegovine")).toBe("bosnie herzegovine");
  });

  it("réduit les espaces multiples et coupe les bords", () => {
    expect(normalizeClubName("  AC  Ajaccio ")).toBe("ac ajaccio");
  });

  it("rapproche deux graphies du même club", () => {
    expect(normalizeClubName("Étoile Rouge Belgrade")).toBe(normalizeClubName("Etoile Rouge Belgrade"));
  });
});
