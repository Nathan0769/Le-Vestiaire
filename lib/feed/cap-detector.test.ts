import { describe, it, expect } from "vitest";
import {
  detectCollectionCap,
  detectValueCap,
  COLLECTION_CAPS,
  VALUE_CAPS,
} from "./cap-detector";

describe("detectCollectionCap", () => {
  it("retourne COLLECTION_50 quand user passe de 49 à 50", () => {
    expect(detectCollectionCap(49, 50)).toBe("COLLECTION_50");
  });

  it("retourne COLLECTION_100 quand user passe de 99 à 100", () => {
    expect(detectCollectionCap(99, 100)).toBe("COLLECTION_100");
  });

  it("retourne COLLECTION_500 quand user passe de 499 à 500", () => {
    expect(detectCollectionCap(499, 500)).toBe("COLLECTION_500");
  });

  it("retourne COLLECTION_1000 quand user passe de 999 à 1000", () => {
    expect(detectCollectionCap(999, 1000)).toBe("COLLECTION_1000");
  });

  it("retourne null quand user passe de 51 à 52 (pas de cap)", () => {
    expect(detectCollectionCap(51, 52)).toBeNull();
  });

  it("retourne null quand user passe de 100 à 101 (cap déjà franchi)", () => {
    expect(detectCollectionCap(100, 101)).toBeNull();
  });

  it("retourne le plus haut cap franchi si l'user saute plusieurs paliers en un ajout batch", () => {
    // Ex : user à 49, ajoute 51 maillots via import → passe à 100
    expect(detectCollectionCap(49, 100)).toBe("COLLECTION_100");
  });

  it("liste les caps ordonnés croissants", () => {
    expect(COLLECTION_CAPS).toEqual([50, 100, 500, 1000]);
  });
});

describe("detectValueCap", () => {
  it("retourne VALUE_1K quand la valeur cumulée passe de 999 à 1000", () => {
    expect(detectValueCap(999, 1000)).toBe("VALUE_1K");
  });

  it("retourne VALUE_5K quand la valeur passe de 4999 à 5000", () => {
    expect(detectValueCap(4999, 5000)).toBe("VALUE_5K");
  });

  it("retourne VALUE_25K quand la valeur passe de 24999 à 25000", () => {
    expect(detectValueCap(24999, 25000)).toBe("VALUE_25K");
  });

  it("retourne null si aucun cap franchi", () => {
    expect(detectValueCap(1500, 1800)).toBeNull();
  });

  it("retourne null quand le cap est déjà atteint (5000 à 5100)", () => {
    expect(detectValueCap(5000, 5100)).toBeNull();
  });

  it("retourne le plus haut cap franchi en un seul saut", () => {
    expect(detectValueCap(999, 5000)).toBe("VALUE_5K");
  });

  it("liste les caps ordonnés croissants", () => {
    expect(VALUE_CAPS).toEqual([1000, 5000, 25000]);
  });
});
