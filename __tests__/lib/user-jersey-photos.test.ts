import { describe, it, expect } from "vitest";
import {
  MAX_USER_JERSEY_PHOTOS,
  MAX_USER_JERSEY_PHOTOS_SUPPORTER,
  maxUserJerseyPhotos,
  normalizeUserPhotoPaths,
} from "@/lib/user-jersey-photos";

describe("maxUserJerseyPhotos", () => {
  it("retourne 2 pour un non-supporter", () => {
    expect(maxUserJerseyPhotos(false)).toBe(MAX_USER_JERSEY_PHOTOS);
    expect(maxUserJerseyPhotos(false)).toBe(2);
  });

  it("retourne 4 pour un supporter", () => {
    expect(maxUserJerseyPhotos(true)).toBe(MAX_USER_JERSEY_PHOTOS_SUPPORTER);
    expect(maxUserJerseyPhotos(true)).toBe(4);
  });
});

describe("normalizeUserPhotoPaths — plafond par tier", () => {
  it("plafonne à 2 par défaut (rejette 3)", () => {
    const res = normalizeUserPhotoPaths(["a", "b", "c"]);
    expect(res.ok).toBe(false);
  });

  it("accepte 4 photos quand max = 4 (supporter)", () => {
    const res = normalizeUserPhotoPaths(["a", "b", "c", "d"], 4);
    expect(res).toEqual({ ok: true, paths: ["a", "b", "c", "d"] });
  });

  it("rejette 5 photos même pour un supporter (max = 4)", () => {
    const res = normalizeUserPhotoPaths(["a", "b", "c", "d", "e"], 4);
    expect(res.ok).toBe(false);
  });

  it("dédupe et retire les vides avant de plafonner", () => {
    const res = normalizeUserPhotoPaths(["a", "a", " ", "b"], 4);
    expect(res).toEqual({ ok: true, paths: ["a", "b"] });
  });
});
