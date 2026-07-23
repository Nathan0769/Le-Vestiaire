import { describe, it, expect } from "vitest";
import { computeRarityMap } from "./rarity";

describe("computeRarityMap", () => {
  it("calcule le ratio possesseurs / total pour chaque clé", () => {
    const result = computeRarityMap(
      [
        { key: "collection.first", users: 90 },
        { key: "collection.50", users: 12 },
      ],
      100,
    );
    expect(result["collection.first"]).toBeCloseTo(0.9);
    expect(result["collection.50"]).toBeCloseTo(0.12);
  });

  it("retourne un objet vide quand il n'y a aucun utilisateur", () => {
    expect(computeRarityMap([{ key: "collection.first", users: 5 }], 0)).toEqual(
      {},
    );
  });

  it("retourne un objet vide pour un total négatif", () => {
    expect(computeRarityMap([{ key: "x", users: 1 }], -3)).toEqual({});
  });

  it("plafonne le ratio à 1 même si les possesseurs dépassent le total", () => {
    // Peut arriver transitoirement si le count users est mis en cache
    const result = computeRarityMap([{ key: "x", users: 120 }], 100);
    expect(result["x"]).toBe(1);
  });

  it("ignore les clés sans possesseur en les laissant absentes", () => {
    const result = computeRarityMap([], 50);
    expect(result).toEqual({});
  });
});
