import { describe, it, expect } from "vitest";
import { localeFromPath, signupLocale, accountLocale, signupLocaleFromHeaders } from "@/lib/account-locale";

describe("localeFromPath", () => {
  it("lit le préfixe de langue d'un chemin", () => {
    expect(localeFromPath("/en/jerseys")).toBe("en");
    expect(localeFromPath("/de")).toBe("de");
  });

  it("ignore un chemin sans préfixe connu", () => {
    expect(localeFromPath("/jerseys")).toBeNull();
    expect(localeFromPath("/english/x")).toBeNull();
    expect(localeFromPath(null)).toBeNull();
  });
});

describe("signupLocale", () => {
  it("préfère la page d'où part l'inscription", () => {
    expect(
      signupLocale({ entryPath: "/es/jerseys/x", referer: "https://site.fr/it/auth/signUp", acceptLanguage: "de" })
    ).toBe("es");
  });

  it("puis la page du Referer", () => {
    expect(signupLocale({ referer: "https://site.fr/it/auth/signUp", acceptLanguage: "de" })).toBe("it");
  });

  it("puis Accept-Language", () => {
    expect(signupLocale({ referer: "https://accounts.google.com/", acceptLanguage: "pt-BR,pt;q=0.9" })).toBe("pt");
  });

  it("français par défaut, y compris pour une langue hors liste", () => {
    expect(signupLocale({})).toBe("fr");
    expect(signupLocale({ acceptLanguage: "ja-JP", referer: "pas une url" })).toBe("fr");
  });
});

describe("accountLocale", () => {
  it("retourne la langue enregistrée si elle est connue, sinon le français", () => {
    expect(accountLocale("nl")).toBe("nl");
    expect(accountLocale(null)).toBe("fr");
    expect(accountLocale("xx")).toBe("fr");
  });
});

describe("signupLocaleFromHeaders", () => {
  it("lit la page d'inscription dans l'en-tête de contexte, puis Referer et Accept-Language", () => {
    const headers = new Headers({
      "x-signup-context": JSON.stringify({ entryPath: "/nl/jerseys" }),
      referer: "https://site.fr/it/auth/signUp",
      "accept-language": "de",
    });
    expect(signupLocaleFromHeaders(headers)).toBe("nl");
    expect(signupLocaleFromHeaders(new Headers({ "accept-language": "en-US" }))).toBe("en");
    expect(signupLocaleFromHeaders(undefined)).toBe("fr");
  });
});
