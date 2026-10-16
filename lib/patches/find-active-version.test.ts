import { describe, it, expect } from "vitest";
import {
  findActiveVersion,
  versionsForClub,
  scopePatchVersionsToClub,
} from "./find-active-version";

function v(
  id: string,
  seasonStart: string,
  seasonEnd: string | null,
  eligibleClubIds: string[] = []
) {
  return { id, seasonStart, seasonEnd, eligibleClubIds, imageUrl: null };
}

describe("findActiveVersion", () => {
  it("renvoie la version du club quand plusieurs clubs ont une version sur la saison", () => {
    const versions = [v("a", "2023", null, ["c1"]), v("b", "2023", null, ["c2"])];
    expect(findActiveVersion(versions, "2024", "c2")?.id).toBe("b");
  });

  it("renvoie une version sans clubs quand aucune version ne cite le club", () => {
    const versions = [v("a", "2023", null, ["c1"]), v("g", "2023", null)];
    expect(findActiveVersion(versions, "2024", "c2")?.id).toBe("g");
  });

  it("renvoie null quand la seule version de la saison cite un autre club", () => {
    const versions = [v("a", "2025", "2025", ["c1"])];
    expect(findActiveVersion(versions, "2025", "c2")).toBeNull();
  });

  it("renvoie null quand aucune version ne couvre la saison", () => {
    const versions = [v("a", "1996", "2014", ["c1"])];
    expect(findActiveVersion(versions, "1990", "c1")).toBeNull();
  });
});

describe("versionsForClub", () => {
  it("garde les versions sans clubs et celles du club", () => {
    const versions = [
      v("a", "2023", null, ["c1"]),
      v("b", "2023", null, ["c2"]),
      v("g", "1996", "2014"),
    ];
    expect(versionsForClub(versions, "c1").map((x) => x.id)).toEqual(["a", "g"]);
  });
});

describe("scopePatchVersionsToClub", () => {
  it("filtre les versions par club, retire eligibleClubIds et garde les patchs perso", () => {
    const patches = [
      {
        id: "up1",
        patch: {
          id: "p1",
          name: "MLS",
          versions: [v("a", "2023", null, ["c1"]), v("b", "2023", null, ["c2"])],
        },
      },
      { id: "up2", patch: null },
    ];
    expect(scopePatchVersionsToClub(patches, "c2")).toEqual([
      {
        id: "up1",
        patch: {
          id: "p1",
          name: "MLS",
          versions: [{ id: "b", seasonStart: "2023", seasonEnd: null, imageUrl: null }],
        },
      },
      { id: "up2", patch: null },
    ]);
  });
});
