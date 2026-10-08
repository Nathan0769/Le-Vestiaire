import { describe, it, expect } from "vitest";
import { validateJerseySize } from "@/lib/jersey-size";

describe("validateJerseySize", () => {
  it("accepte chaque taille de l'enum Size", () => {
    for (const size of ["XS", "S", "M", "L", "XL", "XXL"]) {
      expect(validateJerseySize(size)).toBeNull();
    }
  });

  it("refuse une taille absente (undefined, null, chaîne vide)", () => {
    expect(validateJerseySize(undefined)).toBe("La taille est obligatoire");
    expect(validateJerseySize(null)).toBe("La taille est obligatoire");
    expect(validateJerseySize("")).toBe("La taille est obligatoire");
  });

  it("refuse une valeur hors enum", () => {
    expect(validateJerseySize("XXXL")).toBe("Taille de maillot invalide");
    expect(validateJerseySize("m")).toBe("Taille de maillot invalide");
    expect(validateJerseySize(42)).toBe("Taille de maillot invalide");
  });
});
