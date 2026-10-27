import { describe, it, expect, vi, beforeEach } from "vitest";

// revalidatePath exige le contexte de requete Next : on l'observe sans l'executer.
const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidatePath(p) }));

import { jerseyCachePaths, revalidateJerseyPages } from "@/lib/catalog-revalidation";

const jersey = {
  id: "j1",
  slug: "maillot-psg-domicile-2024-2025",
  clubId: "psg",
  leagueId: "ligue-1",
};

describe("jerseyCachePaths", () => {
  it("couvre la fiche par slug, la fiche par id et le club dans les 7 langues", () => {
    const paths = jerseyCachePaths(jersey);

    for (const locale of ["fr", "en", "es", "de", "pt", "nl", "it"]) {
      expect(paths).toContain(`/${locale}/jerseys/ligue-1/clubs/psg/jerseys/maillot-psg-domicile-2024-2025`);
      expect(paths).toContain(`/${locale}/jerseys/ligue-1/clubs/psg/jerseys/j1`);
      expect(paths).toContain(`/${locale}/jerseys/ligue-1/clubs/psg`);
    }
    expect(paths).toHaveLength(21);
  });

  it("ne duplique pas la fiche quand le maillot n'a pas de slug", () => {
    const paths = jerseyCachePaths({ ...jersey, slug: null });

    expect(paths).toContain("/fr/jerseys/ligue-1/clubs/psg/jerseys/j1");
    expect(paths).toHaveLength(14);
  });
});

describe("revalidateJerseyPages", () => {
  beforeEach(() => revalidatePath.mockClear());

  it("invalide chaque chemin du maillot", () => {
    revalidateJerseyPages(jersey);

    expect(revalidatePath.mock.calls.map(([p]) => p)).toEqual(jerseyCachePaths(jersey));
  });
});
