import { describe, it, expect } from "vitest";
import { pickCoverageClub } from "@/lib/club-coverage";

const owned = new Map<string, number>([
  ["psg", 4],
  ["lyon", 9],
  ["om", 9],
]);

describe("pickCoverageClub", () => {
  it("prend le club favori quand il est défini", () => {
    expect(pickCoverageClub("psg", owned)).toEqual({
      clubId: "psg",
      isFavorite: true,
    });
  });

  it("garde le club favori même sans aucun maillot de ce club", () => {
    expect(pickCoverageClub("nantes", owned)).toEqual({
      clubId: "nantes",
      isFavorite: true,
    });
  });

  it("se rabat sur le club avec le plus de maillots différents sans favori", () => {
    expect(
      pickCoverageClub(null, new Map([["psg", 4], ["lyon", 9]]))
    ).toEqual({ clubId: "lyon", isFavorite: false });
  });

  it("départage les ex aequo par identifiant pour un résultat stable", () => {
    expect(pickCoverageClub(null, owned)).toEqual({
      clubId: "lyon",
      isFavorite: false,
    });
  });

  it("retourne null sans favori ni maillot", () => {
    expect(pickCoverageClub(null, new Map())).toBeNull();
  });
});
