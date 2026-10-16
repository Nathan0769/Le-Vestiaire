import { describe, it, expect } from "vitest";
import type { Patch, PatchVersion } from "@prisma/client";
import {
  computeEligibilityAdditions,
  planCustomPatchLink,
} from "./custom-patch-link";

describe("planCustomPatchLink", () => {
  it("rattache une occurrence dont le maillot ne porte pas la cible", () => {
    const plan = planCustomPatchLink(
      [{ id: "o1", userJerseyId: "uj1", existingPatchIds: ["autre"] }],
      "cible"
    );
    expect(plan).toEqual({ toUpdate: ["o1"], toDelete: [] });
  });

  it("supprime une occurrence dont le maillot porte déjà la cible", () => {
    const plan = planCustomPatchLink(
      [{ id: "o1", userJerseyId: "uj1", existingPatchIds: ["cible"] }],
      "cible"
    );
    expect(plan).toEqual({ toUpdate: [], toDelete: ["o1"] });
  });

  it("ne rattache qu'une occurrence par maillot", () => {
    const plan = planCustomPatchLink(
      [
        { id: "o1", userJerseyId: "uj1", existingPatchIds: [] },
        { id: "o2", userJerseyId: "uj1", existingPatchIds: [] },
      ],
      "cible"
    );
    expect(plan).toEqual({ toUpdate: ["o1"], toDelete: ["o2"] });
  });
});

const now = new Date();

function makePatch(
  eligibleClubIds: string[],
  versions: Partial<PatchVersion>[] = []
): Patch & { versions: PatchVersion[] } {
  return {
    id: "p",
    name: "Patch",
    family: "DOMESTIC_SUPERCUP",
    variant: null,
    leagueId: null,
    isActive: true,
    notes: null,
    eligibleClubIds,
    createdAt: now,
    updatedAt: now,
    versions: versions.map((v, i) => ({
      id: `v${i}`,
      patchId: "p",
      seasonStart: "2019-20",
      seasonEnd: null,
      imageUrl: null,
      eligibleClubIds: [],
      createdAt: now,
      updatedAt: now,
      ...v,
    })),
  };
}

const NOTHING = { patchClubIds: null, versionUpdates: [] };

describe("computeEligibilityAdditions", () => {
  it("ne touche pas des listes vides (tous clubs éligibles)", () => {
    const patch = makePatch([], [{ eligibleClubIds: [] }]);
    expect(
      computeEligibilityAdditions(patch, [{ clubId: "b", season: "2020-21" }])
    ).toEqual(NOTHING);
  });

  it("ajoute le club à la liste du patch sans version couvrante", () => {
    const patch = makePatch(["a"], [{ seasonStart: "2022-23" }]);
    expect(
      computeEligibilityAdditions(patch, [{ clubId: "b", season: "2020-21" }])
    ).toEqual({ patchClubIds: ["a", "b"], versionUpdates: [] });
  });

  it("ajoute le club à la version couvrante quand elle a sa propre liste", () => {
    const patch = makePatch(["x"], [{ eligibleClubIds: ["a"] }]);
    expect(
      computeEligibilityAdditions(patch, [{ clubId: "b", season: "2020-21" }])
    ).toEqual({
      patchClubIds: null,
      versionUpdates: [{ versionId: "v0", clubIds: ["a", "b"] }],
    });
  });

  it("n'écrit rien si le club est déjà éligible", () => {
    const patch = makePatch(["b"]);
    expect(
      computeEligibilityAdditions(patch, [{ clubId: "b", season: "2020-21" }])
    ).toEqual(NOTHING);
  });

  it("n'ajoute qu'une fois un club présent dans plusieurs occurrences", () => {
    const patch = makePatch(["a"]);
    expect(
      computeEligibilityAdditions(patch, [
        { clubId: "b", season: "2020-21" },
        { clubId: "b", season: "2021-22" },
      ])
    ).toEqual({ patchClubIds: ["a", "b"], versionUpdates: [] });
  });

  it("ne rajoute pas un club dans la version d'un autre club quand il a la sienne", () => {
    const patch = makePatch(
      [],
      [
        { seasonStart: "2023", eligibleClubIds: ["a"] },
        { seasonStart: "2023", eligibleClubIds: ["b"] },
      ]
    );
    expect(
      computeEligibilityAdditions(patch, [{ clubId: "b", season: "2024" }])
    ).toEqual(NOTHING);
  });
});
