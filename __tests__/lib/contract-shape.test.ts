import { describe, it, expect } from "vitest";
import { contractShape, breakingChanges } from "@/lib/contract-shape";

describe("contractShape", () => {
  it("décrit chaque chemin par son type", () => {
    expect(contractShape({ id: "a", count: 2, ok: true, bio: null })).toEqual({
      "": "object",
      ".bio": "null",
      ".count": "number",
      ".id": "string",
      ".ok": "boolean",
    });
  });

  it("fusionne les types des éléments d'un tableau", () => {
    expect(contractShape([{ price: 10 }, { price: null }])).toEqual({
      "": "array",
      "[]": "object",
      "[].price": "null|number",
    });
  });

  it("marque absente une clé que certains éléments n'ont pas", () => {
    expect(contractShape([{ a: 1, b: "x" }, { a: 2 }])["[].b"]).toBe("absent|string");
  });

  it("décrit les objets imbriqués", () => {
    expect(contractShape({ club: { league: { name: "L1" } } })[".club.league.name"]).toBe("string");
  });
});

describe("breakingChanges", () => {
  const expected = { "": "object", ".id": "string", ".bio": "null|string", ".name": "string" };

  it("signale un champ retiré", () => {
    const { [".name"]: _removed, ...actual } = expected;
    expect(breakingChanges(expected, actual)).toEqual([".name : retiré (string)"]);
  });

  it("signale un type nouveau pour l'app", () => {
    expect(breakingChanges(expected, { ...expected, ".id": "null|string" })).toEqual([
      ".id : string -> null|string",
    ]);
  });

  it("accepte un champ ajouté", () => {
    expect(breakingChanges(expected, { ...expected, ".slug": "string" })).toEqual([]);
  });

  it("accepte un type plus étroit", () => {
    expect(breakingChanges(expected, { ...expected, ".bio": "string" })).toEqual([]);
  });
});
