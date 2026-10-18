import { describe, it, expect } from "vitest";
import {
  collectionItemFieldError,
  normalizePatchInputs,
  COLLECTION_ITEM_LIMITS,
} from "@/lib/collection-item-rules";

const valid = { size: "M", condition: "MINT" };

describe("collectionItemFieldError", () => {
  it("accepte un maillot minimal valide", () => {
    expect(collectionItemFieldError(valid)).toBeNull();
  });

  it("refuse une version inconnue", () => {
    expect(collectionItemFieldError({ ...valid, version: "FAKE" })?.code).toBe("VERSION_INVALID");
  });

  it("exige la taille avant l'état", () => {
    expect(collectionItemFieldError({})?.code).toBe("SIZE_REQUIRED");
  });

  it("exige l'état", () => {
    expect(collectionItemFieldError({ size: "M" })?.code).toBe("CONDITION_REQUIRED");
  });

  it("refuse une date d'achat future", () => {
    const future = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
    expect(collectionItemFieldError({ ...valid, purchaseDate: future })?.code).toBe("PURCHASE_DATE_IN_FUTURE");
  });

  it("borne le numéro de joueur", () => {
    expect(collectionItemFieldError({ ...valid, playerNumber: COLLECTION_ITEM_LIMITS.playerNumberMax })).toBeNull();
    expect(collectionItemFieldError({ ...valid, playerNumber: 0 })?.code).toBe("PLAYER_NUMBER_INVALID");
  });

  it("borne la longueur des notes", () => {
    const notes = "a".repeat(COLLECTION_ITEM_LIMITS.notesMax + 1);
    expect(collectionItemFieldError({ ...valid, notes })?.code).toBe("NOTES_TOO_LONG");
  });

  it("exige une URL de certificat en https", () => {
    expect(collectionItemFieldError({ ...valid, certificateUrl: "http://example.com" })?.code).toBe("CERTIFICATE_URL_NOT_HTTPS");
    expect(collectionItemFieldError({ ...valid, certificateUrl: "pas une url" })?.code).toBe("CERTIFICATE_URL_INVALID");
  });

  it("refuse un prix négatif", () => {
    expect(collectionItemFieldError({ ...valid, purchasePrice: -1 })?.code).toBe("PURCHASE_PRICE_INVALID");
  });
});

describe("normalizePatchInputs", () => {
  it("dédoublonne les patchs et nettoie les labels", () => {
    expect(normalizePatchInputs([{ patchId: "a" }, { patchId: "a" }, { customLabel: "  Fait main " }])).toEqual({
      ok: true,
      patches: [{ patchId: "a", customLabel: undefined }, { patchId: undefined, customLabel: "Fait main" }],
    });
  });

  it("refuse un label trop long", () => {
    const label = "a".repeat(COLLECTION_ITEM_LIMITS.patchLabelMax + 1);
    const result = normalizePatchInputs([{ customLabel: label }]);
    expect(result.ok === false && result.code).toBe("PATCH_LABEL_TOO_LONG");
  });

  it("refuse un patch vide et une valeur qui n'est pas un tableau", () => {
    expect(normalizePatchInputs([{}]).ok).toBe(false);
    expect(normalizePatchInputs("x").ok).toBe(false);
  });
});
