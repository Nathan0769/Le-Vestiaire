import { describe, it, expect } from "vitest";
import {
  containsProfanity,
  normalizeForProfanity,
} from "@/lib/username-blocklist";

describe("username-blocklist", () => {
  describe("normalizeForProfanity", () => {
    it("met en minuscules", () => {
      expect(normalizeForProfanity("CaCa")).toBe("caca");
    });

    it("convertit le leetspeak", () => {
      expect(normalizeForProfanity("m3rd3")).toBe("merde");
      expect(normalizeForProfanity("c0nn4rd")).toBe("connard");
    });

    it("conserve les séparateurs", () => {
      expect(normalizeForProfanity("sale_con")).toBe("sale_con");
    });
  });

  describe("containsProfanity - termes bloqués", () => {
    it("bloque un terme grossier direct", () => {
      expect(containsProfanity("connard")).toBe(true);
    });

    it("bloque un terme scatologique", () => {
      expect(containsProfanity("caca")).toBe(true);
      expect(containsProfanity("pipi")).toBe(true);
    });

    it("bloque même entouré d'autres caractères", () => {
      expect(containsProfanity("xxmerdexx")).toBe(true);
    });

    it("bloque les tentatives en leetspeak", () => {
      expect(containsProfanity("c0nn4rd")).toBe(true);
      expect(containsProfanity("C4-Ca")).toBe(true);
      expect(containsProfanity("5h1t")).toBe(true);
    });

    it("bloque les termes extrémistes / haineux", () => {
      expect(containsProfanity("hitler")).toBe(true);
      expect(containsProfanity("nazi_fan")).toBe(true);
      expect(containsProfanity("jihadiste")).toBe(true);
    });

    it("bloque une racine courte isolée par un séparateur", () => {
      expect(containsProfanity("sale_con")).toBe(true);
      expect(containsProfanity("gros-cul")).toBe(true);
    });
  });

  describe("containsProfanity - pseudos légitimes (pas de faux positif)", () => {
    it("laisse passer les mots contenant une racine courte", () => {
      expect(containsProfanity("bacon")).toBe(false);
      expect(containsProfanity("falcon")).toBe(false);
      expect(containsProfanity("culture")).toBe(false);
      expect(containsProfanity("dispute")).toBe(false);
    });

    it("laisse passer les mots proches d'une insulte", () => {
      expect(containsProfanity("unique")).toBe(false);
      expect(containsProfanity("technique")).toBe(false);
      expect(containsProfanity("escalope")).toBe(false);
      expect(containsProfanity("grenouille")).toBe(false);
    });

    it("laisse passer les pseudos ordinaires", () => {
      expect(containsProfanity("Nathan99")).toBe(false);
      expect(containsProfanity("player_123")).toBe(false);
      expect(containsProfanity("the-goal-machine")).toBe(false);
    });
  });
});
