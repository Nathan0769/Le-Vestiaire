import { describe, it, expect } from "vitest";
import {
  validateImageFile,
  validateImageFileBasic,
  MAX_FILE_SIZE,
} from "@/lib/file-validation";
import { validateUsername } from "@/lib/username-generator";
import { jerseySizeErrorCode } from "@/lib/jersey-size";
import { normalizeUserPhotoPaths } from "@/lib/user-jersey-photos";

function file(size: number, name: string, type: string): File {
  return new File([new Blob([new Uint8Array(size)], { type })], name, { type });
}

// Les messages d'erreur sont en français : l'app mobile traduit ces codes.
describe("codes d'erreur des validateurs", () => {
  it("fichier trop gros", () => {
    const result = validateImageFileBasic(
      file(MAX_FILE_SIZE + 1, "a.jpg", "image/jpeg"),
    );
    expect(result.code).toBe("FILE_TOO_LARGE");
  });

  it("type de fichier refusé", () => {
    const result = validateImageFileBasic(file(2048, "a.gif", "image/gif"));
    expect(result.code).toBe("FILE_TYPE_NOT_ALLOWED");
  });

  it("fichier illisible", async () => {
    const result = await validateImageFile(file(10, "a.jpg", "image/jpeg"));
    expect(result.code).toBe("FILE_INVALID");
  });

  it("fichier valide : pas de code", () => {
    expect(
      validateImageFileBasic(file(2048, "a.jpg", "image/jpeg")).code,
    ).toBeUndefined();
  });

  it("pseudo trop court", () => {
    expect(validateUsername("abc").code).toBe("USERNAME_TOO_SHORT");
  });

  it("pseudo trop long", () => {
    expect(validateUsername("a".repeat(21)).code).toBe("USERNAME_TOO_LONG");
  });

  it("pseudo avec caractères interdits", () => {
    expect(validateUsername("abc def").code).toBe("USERNAME_INVALID_CHARS");
  });

  it("pseudo qui commence par un tiret", () => {
    expect(validateUsername("-abcde").code).toBe("USERNAME_INVALID_START");
  });

  it("pseudo valide : pas de code", () => {
    expect(validateUsername("abcde").code).toBeUndefined();
  });

  it("taille absente", () => {
    expect(jerseySizeErrorCode("")).toBe("SIZE_REQUIRED");
    expect(jerseySizeErrorCode(undefined)).toBe("SIZE_REQUIRED");
  });

  it("taille inconnue", () => {
    expect(jerseySizeErrorCode("XXXL")).toBe("SIZE_INVALID");
  });

  it("taille valide : pas de code", () => {
    expect(jerseySizeErrorCode("M")).toBeNull();
  });

  it("trop de photos", () => {
    const result = normalizeUserPhotoPaths(["a", "b", "c"], 2);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("TOO_MANY_PHOTOS");
  });
});
