import { describe, expect, it } from "vitest";
import { mostFrequentSize, parseWishlistGiftPatch } from "./wishlist-gift-fields";

describe("parseWishlistGiftPatch", () => {
  it("accepte des infos cadeau valides", () => {
    expect(
      parseWishlistGiftPatch({ size: "M", version: "AUTHENTIC", flockName: "MBAPPE", flockNumber: 10, priority: 2 })
    ).toEqual({
      ok: true,
      data: { size: "M", version: "AUTHENTIC", flockName: "MBAPPE", flockNumber: 10, priority: 2 },
    });
  });

  it("ne garde que les champs envoyés (PATCH partiel)", () => {
    expect(parseWishlistGiftPatch({ priority: 1 })).toEqual({ ok: true, data: { priority: 1 } });
  });

  it("trime le nom de flocage et transforme une chaîne vide en null", () => {
    expect(parseWishlistGiftPatch({ flockName: "  " })).toEqual({ ok: true, data: { flockName: null } });
  });

  it("accepte null pour effacer la taille", () => {
    expect(parseWishlistGiftPatch({ size: null })).toEqual({ ok: true, data: { size: null } });
  });

  it("refuse une taille inconnue avec SIZE_INVALID", () => {
    const result = parseWishlistGiftPatch({ size: "XXXXL" });
    expect(result.ok === false && result.code).toBe("SIZE_INVALID");
  });

  it("refuse une version inconnue avec VERSION_INVALID", () => {
    const result = parseWishlistGiftPatch({ version: "FAKE" });
    expect(result.ok === false && result.code).toBe("VERSION_INVALID");
  });

  it("refuse un numéro hors limites avec PLAYER_NUMBER_INVALID", () => {
    const result = parseWishlistGiftPatch({ flockNumber: 1000 });
    expect(result.ok === false && result.code).toBe("PLAYER_NUMBER_INVALID");
  });

  it("refuse un nom trop long avec PLAYER_NAME_TOO_LONG", () => {
    const result = parseWishlistGiftPatch({ flockName: "A".repeat(101) });
    expect(result.ok === false && result.code).toBe("PLAYER_NAME_TOO_LONG");
  });

  it("refuse une priorité autre que 1 ou 2", () => {
    expect(parseWishlistGiftPatch({ priority: 5 }).ok).toBe(false);
  });

  it("refuse un corps qui n'est pas un objet", () => {
    expect(parseWishlistGiftPatch("size=M").ok).toBe(false);
  });
});

describe("mostFrequentSize", () => {
  it("renvoie la taille la plus fréquente", () => {
    expect(mostFrequentSize(["M", "L", "M", null])).toBe("M");
  });

  it("renvoie null sans taille connue", () => {
    expect(mostFrequentSize([null, undefined])).toBeNull();
  });
});
