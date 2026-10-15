import { describe, it, expect } from "vitest";
import type { CustomPatchOccurrence } from "@/types/patch";
import { groupCustomPatches, normalizeCustomLabel } from "./custom-patch-label";

function occ(id: string, customLabel: string): CustomPatchOccurrence {
  return {
    id,
    customLabel,
    userJerseyId: `uj-${id}`,
    username: "user",
    jersey: { id: "j", name: "Maillot", season: "2019-20", clubId: "c", clubName: "Club" },
  };
}

describe("normalizeCustomLabel", () => {
  it("retire accents, casse et espaces superflus", () => {
    expect(normalizeCustomLabel("  Trophée  des CHAMPIONS ")).toBe(
      "trophee des champions"
    );
  });
});

describe("groupCustomPatches", () => {
  it("regroupe les variantes d'un même libellé normalisé", () => {
    const groups = groupCustomPatches([
      occ("1", "Trophée des champions"),
      occ("2", "trophee des Champions"),
    ]);
    expect(groups.map((g) => g.count)).toEqual([2]);
  });

  it("affiche la variante la plus fréquente, la première en cas d'égalité", () => {
    const [mostFrequent] = groupCustomPatches([
      occ("1", "tdc"),
      occ("2", "TDC"),
      occ("3", "TDC"),
    ]);
    const [tie] = groupCustomPatches([occ("1", "tdc"), occ("2", "TDC")]);
    expect([mostFrequent.label, tie.label]).toEqual(["TDC", "tdc"]);
  });

  it("liste les variantes sans doublon", () => {
    const [group] = groupCustomPatches([
      occ("1", "TDC"),
      occ("2", "TDC"),
      occ("3", "tdc"),
    ]);
    expect(group.variants).toEqual(["TDC", "tdc"]);
  });

  it("trie les groupes par nombre d'occurrences décroissant", () => {
    const groups = groupCustomPatches([
      occ("1", "Coupe"),
      occ("2", "Ligue"),
      occ("3", "ligue"),
    ]);
    expect(groups.map((g) => g.key)).toEqual(["ligue", "coupe"]);
  });
});
