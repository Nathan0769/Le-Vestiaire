import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createTranslator } from "next-intl";
import { locales } from "@/i18n/locales";
import { seasonForTitle, specialJerseyTitle } from "@/lib/jersey-seo-title";

describe("seasonForTitle", () => {
  it("écrit une saison courte en années complètes avec une barre", () => {
    expect(seasonForTitle("2023-24")).toBe("2023/2024");
  });

  it("passe le siècle", () => {
    expect(seasonForTitle("1999-00")).toBe("1999/2000");
  });

  it("accepte une saison déjà longue", () => {
    expect(seasonForTitle("2024-2025")).toBe("2024/2025");
  });

  it("laisse l'année seule des sélections", () => {
    expect(seasonForTitle("2026")).toBe("2026");
  });

  it("laisse un format inconnu tel quel", () => {
    expect(seasonForTitle("Saison spéciale")).toBe("Saison spéciale");
  });
});

describe("specialJerseyTitle (maillot SPECIAL)", () => {
  it("garde l'événement écrit après la saison", () => {
    expect(specialJerseyTitle("Maillot Spécial Manchester City 2010-11 FA Cup Final", "2010-11")).toEqual({
      event: "FA Cup Final",
      customName: null,
    });
  });

  it("un nom générique n'apporte rien", () => {
    expect(specialJerseyTitle("Maillot Spécial FC Nantes 2017-18", "2017-18")).toEqual({ event: null, customName: null });
  });

  it("un nom propre au maillot est repris, saison en années complètes", () => {
    expect(specialJerseyTitle("Maillot Totti AS Roma 2017-18", "2017-18")).toEqual({
      event: null,
      customName: "Maillot Totti AS Roma 2017/2018",
    });
  });

  it("« Special » en anglais est générique aussi", () => {
    expect(specialJerseyTitle("Maillot Special Mallorca 2022-23", "2022-23")).toEqual({ event: null, customName: null });
  });

  it("sépare la saison collée au nom", () => {
    expect(specialJerseyTitle("Maillot Leipzig On Fire2022-23", "2022-23").customName).toBe(
      "Maillot Leipzig On Fire 2022/2023"
    );
  });

  it.each(["2026/27", "2026-2027", "2026/2027"])("reconnaît la saison écrite %s dans le nom", (written) => {
    expect(specialJerseyTitle(`Maillot Benfica Rétro ${written}`, "2026-27").customName).toBe(
      "Maillot Benfica Rétro 2026/2027"
    );
  });

  it("ajoute la saison au nom propre qui ne l'a pas", () => {
    expect(specialJerseyTitle("Maillot Paris x Renault FC", "2024-25")).toEqual({
      event: null,
      customName: "Maillot Paris x Renault FC 2024/2025",
    });
  });
});

function seoTitle(
  locale: string,
  values: { clubName: string; type: string; typeLower: string; season: string; kind?: string; variantSuffix?: string }
) {
  const messages = JSON.parse(readFileSync(join(process.cwd(), "messages", `${locale}.json`), "utf8"));
  const t = createTranslator({ locale, messages, namespace: "JerseyMetadata" });
  return t("seoTitle", { kind: "other", variantSuffix: "", ...values });
}

describe("titre Google d'une fiche (JerseyMetadata.seoTitle)", () => {
  it("français : Maillot, club, type, saison", () => {
    expect(
      seoTitle("fr", { clubName: "Paris Saint-Germain", type: "Extérieur", typeLower: "extérieur", season: "2023/2024" })
    ).toBe("Maillot Paris Saint-Germain extérieur 2023/2024");
  });

  // Mots composés réellement tapés en allemand (« elversberg auswärtstrikot »)
  it.each([
    ["HOME", "Heim", "SV Elversberg Heimtrikot 2025/2026"],
    ["AWAY", "Auswärts", "SV Elversberg Auswärtstrikot 2025/2026"],
    ["THIRD", "Drittes", "SV Elversberg Ausweichtrikot 2025/2026"],
    ["SPECIAL", "Special", "SV Elversberg Sondertrikot 2025/2026"],
    ["OKTOBERFEST", "Oktoberfest", "SV Elversberg Oktoberfest-Trikot 2025/2026"],
  ])("allemand %s : %s", (kind, type, expected) => {
    expect(
      seoTitle("de", { clubName: "SV Elversberg", type, typeLower: type.toLowerCase(), season: "2025/2026", kind })
    ).toBe(expected);
  });

  it("allemand : deuxième maillot gardien numéroté", () => {
    expect(
      seoTitle("de", {
        clubName: "SV Elversberg",
        type: "Torwart 2",
        typeLower: "torwart 2",
        season: "2025/2026",
        kind: "GOALKEEPER",
        variantSuffix: " 2",
      })
    ).toBe("SV Elversberg Torwarttrikot 2 2025/2026");
  });

  // Ni marque, ni note, ni nom du site : Google affiche le nom du site au-dessus,
  // et le titre doit tenir dans les ~60 caractères visibles sur mobile.
  it.each(locales)("%s : ni nom du site, ni séparateur, moins de 60 caractères", (locale) => {
    const title = seoTitle(locale, {
      clubName: "Olympique de Marseille",
      type: "Extérieur",
      typeLower: "extérieur",
      season: "2025/2026",
    });
    expect(title).toContain("Olympique de Marseille");
    expect(title).toContain("2025/2026");
    expect(title).not.toMatch(/\||Vestiaire|Locker|Vestuario|Spogliatoio/);
    expect(title.length).toBeLessThan(60);
  });
});
