import { describe, it, expect } from "vitest";
import {
  autoJerseyDescription,
  type AutoJerseyDescriptionInput,
} from "./auto-jersey-description";

const base: AutoJerseyDescriptionInput = {
  id: "clx0001",
  clubName: "Paris Saint-Germain",
  clubShortName: "PSG",
  season: "2023-2024",
  type: "HOME",
  variant: 1,
  brand: "Nike",
  leagueName: "Ligue 1",
  collectionCount: 42,
  averageRating: 4.3,
  totalRatings: 18,
  locale: "fr",
};

function wordCount(s: string): number {
  return s.trim().split(/\s+/).length;
}

describe("autoJerseyDescription", () => {
  it("produit un texte FR de 80 a 125 mots", () => {
    const out = autoJerseyDescription(base);
    const wc = wordCount(out);
    expect(wc).toBeGreaterThanOrEqual(80);
    expect(wc).toBeLessThanOrEqual(125);
    expect(out.toLowerCase()).toContain("maillot");
  });

  it("produit un texte EN de 80 a 125 mots", () => {
    const out = autoJerseyDescription({ ...base, locale: "en" });
    const wc = wordCount(out);
    expect(wc).toBeGreaterThanOrEqual(80);
    expect(wc).toBeLessThanOrEqual(125);
    expect(out.toLowerCase()).toContain("shirt");
  });

  it("retombe sur l'anglais pour une locale non supportee", () => {
    const de = autoJerseyDescription({ ...base, locale: "de" });
    const en = autoJerseyDescription({ ...base, locale: "en" });
    expect(de).toBe(en);
  });

  it("omet la preuve sociale quand collection et notes sont a zero", () => {
    const withSocial = autoJerseyDescription(base);
    const withoutSocial = autoJerseyDescription({
      ...base,
      collectionCount: 0,
      averageRating: 0,
      totalRatings: 0,
    });
    expect(withSocial).toContain("collections");
    expect(withoutSocial).not.toContain("collections");
    expect(wordCount(withoutSocial)).toBeGreaterThanOrEqual(80);
    // pas de "0 collectionneur" / "0 collections" residuel
    expect(withoutSocial).not.toMatch(/\b0\b/);
  });

  it("mentionne les titres gagnes cette saison quand ils existent", () => {
    const out = autoJerseyDescription({
      ...base,
      trophies: [
        { competition: "Coupe de France", place: "Winner" },
        { competition: "Trophée des Champions", place: "Winner" },
      ],
    });
    expect(out).toContain("Coupe de France");
    expect(out).toMatch(/remport/);
  });

  it("mentionne les finales atteintes a defaut de titre", () => {
    const out = autoJerseyDescription({
      ...base,
      trophies: [{ competition: "UEFA Champions League", place: "Finalist" }],
    });
    expect(out).toContain("UEFA Champions League");
    expect(out).toMatch(/finale/);
  });

  it("mentionne les joueurs de l'effectif quand ils existent", () => {
    const out = autoJerseyDescription({
      ...base,
      players: [{ name: "Kylian Mbappe" }, { name: "Marquinhos" }],
    });
    expect(out).toContain("Mbappe");
  });

  it("est deterministe : meme entree, meme sortie", () => {
    expect(autoJerseyDescription(base)).toBe(autoJerseyDescription(base));
  });

  it("varie la charpente selon l'id", () => {
    const outputs = Array.from({ length: 10 }, (_, i) =>
      autoJerseyDescription({ ...base, id: String(i) })
    );
    expect(new Set(outputs).size).toBeGreaterThanOrEqual(2);
  });

  it("ne laisse aucun placeholder brut non resolu", () => {
    const out = autoJerseyDescription(base);
    expect(out).not.toMatch(/[{}]/);
    expect(out).not.toMatch(/undefined|null/);
  });
});
