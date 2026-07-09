import { describe, it, expect } from "vitest";
import {
  normalizeBrand,
  brandToSlug,
  slugToBrand,
  isSupportedBrand,
  SUPPORTED_BRAND_SLUGS,
  getBrandVariants,
} from "@/lib/brand-utils";

describe("normalizeBrand", () => {
  it("normalise la casse en Title Case", () => {
    expect(normalizeBrand("NIKE")).toBe("Nike");
    expect(normalizeBrand("nike")).toBe("Nike");
    expect(normalizeBrand("Nike")).toBe("Nike");
  });

  it("trim les espaces", () => {
    expect(normalizeBrand("  Adidas  ")).toBe("Adidas");
  });

  it("conserve les mots multiples", () => {
    expect(normalizeBrand("le coq sportif")).toBe("Le Coq Sportif");
  });

  it("retourne chaîne vide pour input vide", () => {
    expect(normalizeBrand("")).toBe("");
    expect(normalizeBrand("   ")).toBe("");
  });
});

describe("brandToSlug", () => {
  it("convertit en minuscules", () => {
    expect(brandToSlug("Nike")).toBe("nike");
    expect(brandToSlug("ADIDAS")).toBe("adidas");
  });

  it("remplace les espaces par des tirets", () => {
    expect(brandToSlug("Le Coq Sportif")).toBe("le-coq-sportif");
  });

  it("retire les accents", () => {
    expect(brandToSlug("Sondico Élite")).toBe("sondico-elite");
  });
});

describe("slugToBrand", () => {
  it("retourne le nom canonique pour un slug supporté", () => {
    expect(slugToBrand("nike")).toBe("Nike");
    expect(slugToBrand("adidas")).toBe("Adidas");
    expect(slugToBrand("puma")).toBe("Puma");
  });

  it("retourne null pour un slug non supporté", () => {
    expect(slugToBrand("invalide")).toBeNull();
    expect(slugToBrand("hummel")).toBeNull();
  });
});

describe("isSupportedBrand", () => {
  it("retourne true pour les slugs whitelistés", () => {
    expect(isSupportedBrand("nike")).toBe(true);
    expect(isSupportedBrand("adidas")).toBe(true);
    expect(isSupportedBrand("puma")).toBe(true);
  });

  it("retourne false pour tout le reste", () => {
    expect(isSupportedBrand("hummel")).toBe(false);
    expect(isSupportedBrand("umbro")).toBe(false);
    expect(isSupportedBrand("")).toBe(false);
  });
});

describe("SUPPORTED_BRAND_SLUGS", () => {
  it("contient exactement les 3 marques du sprint 1", () => {
    expect(SUPPORTED_BRAND_SLUGS).toEqual(["nike", "adidas", "puma"]);
  });
});

describe("getBrandVariants", () => {
  it("retourne toutes les variantes de casse d'une marque", () => {
    const variants = getBrandVariants("nike");
    expect(variants).toContain("Nike");
    expect(variants).toContain("NIKE");
    expect(variants).toContain("nike");
  });

  it("retourne un tableau vide pour un slug non supporté", () => {
    expect(getBrandVariants("hummel")).toEqual([]);
  });
});
