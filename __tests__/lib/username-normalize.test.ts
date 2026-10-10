import { describe, it, expect } from "vitest";
import { normalizeUsername, validateUsername } from "@/lib/username-generator";

describe("normalizeUsername", () => {
  it("retire les espaces en fin et en début de pseudo", () => {
    expect(normalizeUsername("nathan ")).toBe("nathan");
    expect(normalizeUsername("  nathan")).toBe("nathan");
    expect(normalizeUsername("\tnathan\n")).toBe("nathan");
  });

  it("retire aussi les espaces insécables et invisibles en bordure", () => {
    expect(normalizeUsername("nathan ")).toBe("nathan");
    expect(normalizeUsername("nathan​")).toBe("nathan");
  });

  it("ne touche pas à un pseudo déjà propre", () => {
    expect(normalizeUsername("Nathan_07")).toBe("Nathan_07");
  });

  it("la valeur normalisée d'un pseudo valide ne contient aucun espace", () => {
    const raw = "nathan ";
    expect(validateUsername(raw).valid).toBe(true);
    expect(/\s/.test(normalizeUsername(raw))).toBe(false);
  });
});
