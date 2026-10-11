import { describe, it, expect } from "vitest";
import { parseAcceptLanguage, getRequestLocale } from "./request-locale";

describe("parseAcceptLanguage", () => {
  it("retourne le français quand l'en-tête est absent", () => {
    expect(parseAcceptLanguage(null)).toBe("fr");
    expect(parseAcceptLanguage(undefined)).toBe("fr");
    expect(parseAcceptLanguage("")).toBe("fr");
  });

  it("retourne une langue supportée telle quelle", () => {
    expect(parseAcceptLanguage("en")).toBe("en");
  });

  it("ignore la région et la casse", () => {
    expect(parseAcceptLanguage("en-GB")).toBe("en");
    expect(parseAcceptLanguage("PT-br")).toBe("pt");
  });

  it("retourne le français pour une langue non supportée", () => {
    expect(parseAcceptLanguage("ja")).toBe("fr");
  });

  it("prend la première langue supportée d'une liste pondérée", () => {
    expect(parseAcceptLanguage("ja, de;q=0.8, en;q=0.9")).toBe("en");
  });

  it("respecte l'ordre quand les poids sont égaux", () => {
    expect(parseAcceptLanguage("es-ES,es;q=0.9,en;q=0.9")).toBe("es");
  });

  it("ne laisse jamais passer une valeur hors liste", () => {
    expect(parseAcceptLanguage("../../etc/passwd")).toBe("fr");
    expect(parseAcceptLanguage("*")).toBe("fr");
    expect(parseAcceptLanguage("en;q=abc")).toBe("en");
  });
});

describe("getRequestLocale", () => {
  it("lit l'en-tête Accept-Language de la requête", () => {
    const request = new Request("https://example.test/api", {
      headers: { "Accept-Language": "de-DE" },
    });
    expect(getRequestLocale(request)).toBe("de");
  });

  it("retourne le français sans en-tête", () => {
    expect(getRequestLocale(new Request("https://example.test/api"))).toBe("fr");
  });
});
