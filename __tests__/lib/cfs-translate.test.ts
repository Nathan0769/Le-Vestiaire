import { describe, it, expect } from "vitest";
import { translateJerseyName, TRANSLATION_ORDER, type TermKey } from "@/lib/cfs-translate";

const FR: Record<TermKey, string> = {
  "Authentic Home Shirt": "Maillot Domicile Authentique",
  "Authentic Away Shirt": "Maillot Extérieur Authentique",
  "Authentic Third Shirt": "Maillot Third Authentique",
  "Authentic Fourth Shirt": "Maillot Quatrième Authentique",
  "Player Issue Home Shirt": "Maillot Domicile Edition joueur",
  "Player Issue Away Shirt": "Maillot Extérieur Edition joueur",
  "Player Issue Third Shirt": "Maillot Third Edition joueur",
  "Home Shirt": "Maillot Domicile",
  "Away Shirt": "Maillot Extérieur",
  "Third Shirt": "Maillot Third",
  "Fourth Shirt": "Maillot Quatrième",
  "Anniversary Shirt": "Maillot Anniversaire",
  "Player Issue": "Edition joueur",
  "In Box": "En boîte",
  "L/S": "ML",
  Authentic: "Authentique",
  Anniversary: "Anniversaire",
  Fourth: "Quatrième",
  Third: "Third",
  Away: "Extérieur",
  Home: "Domicile",
  Shirt: "Maillot",
};

const EN: Record<TermKey, string> = Object.fromEntries(
  TRANSLATION_ORDER.map((k) => [k, k])
) as Record<TermKey, string>;

describe("translateJerseyName", () => {
  describe("ordre des mots en français (compound phrases)", () => {
    it("Home Shirt → Maillot Domicile (pas Domicile Maillot)", () => {
      expect(translateJerseyName("2024-25 Manchester City Home Shirt", FR)).toBe(
        "2024-25 Manchester City Maillot Domicile"
      );
    });

    it("Away Shirt → Maillot Extérieur", () => {
      expect(translateJerseyName("2024-25 Arsenal Away Shirt", FR)).toBe(
        "2024-25 Arsenal Maillot Extérieur"
      );
    });

    it("Authentic Home Shirt → Maillot Domicile Authentique", () => {
      expect(
        translateJerseyName("2022-23 Italy Authentic Home Shirt", FR)
      ).toBe("2022-23 Italy Maillot Domicile Authentique");
    });

    it("Authentic Away Shirt → Maillot Extérieur Authentique", () => {
      expect(
        translateJerseyName("2022-23 Italy Authentic Away Shirt", FR)
      ).toBe("2022-23 Italy Maillot Extérieur Authentique");
    });

    it("Player Issue Home Shirt → Maillot Domicile Edition joueur", () => {
      expect(
        translateJerseyName(
          "2021-22 Borussia Dortmund Player Issue Home Shirt",
          FR
        )
      ).toBe("2021-22 Borussia Dortmund Maillot Domicile Edition joueur");
    });

    it("Anniversary Shirt → Maillot Anniversaire", () => {
      expect(
        translateJerseyName("2025-26 Germany 125th Anniversary Shirt", FR)
      ).toBe("2025-26 Germany 125th Maillot Anniversaire");
    });

    it("Third Shirt → Maillot Third", () => {
      expect(translateJerseyName("2021-22 Juventus Authentic Third Shirt", FR)).toBe(
        "2021-22 Juventus Maillot Third Authentique"
      );
    });
  });

  describe("termes individuels en fallback", () => {
    it("traduit L/S seul", () => {
      expect(
        translateJerseyName("2025-26 Germany Anniversary L/S Shirt", FR)
      ).toBe("2025-26 Germany Anniversaire ML Maillot");
    });

    it("traduit In Box", () => {
      expect(
        translateJerseyName(
          "2024-25 Manchester City Authentic Home Shirt - In Box",
          FR
        )
      ).toBe(
        "2024-25 Manchester City Maillot Domicile Authentique - En boîte"
      );
    });

    it("traduit Anniversary seul (sans Shirt)", () => {
      const result = translateJerseyName("Germany Anniversary Edition", FR);
      expect(result).toContain("Anniversaire");
    });
  });

  describe("anglais (pas de traduction)", () => {
    it("ne modifie rien en anglais", () => {
      const name = "2024-25 Manchester City Away Shirt";
      expect(translateJerseyName(name, EN)).toBe(name);
    });

    it("ne modifie rien pour Authentic Home Shirt en anglais", () => {
      const name = "2022-23 Italy Authentic Home Shirt";
      expect(translateJerseyName(name, EN)).toBe(name);
    });
  });

  describe("cas limites", () => {
    it("ne remplace pas un mot partiel (Homes ne devient pas Domiciles)", () => {
      expect(translateJerseyName("HomeShirt", FR)).toBe("HomeShirt");
    });

    it("préserve la casse du reste du nom", () => {
      const result = translateJerseyName("2024-25 AC Milan Away Shirt", FR);
      expect(result).toBe("2024-25 AC Milan Maillot Extérieur");
    });

    it("retourne le nom intact si aucun terme connu", () => {
      const name = "2024-25 Unknown Club Special Edition";
      expect(translateJerseyName(name, FR)).toBe(name);
    });
  });
});
