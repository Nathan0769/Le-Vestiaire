import { describe, expect, it } from "vitest";
import {
  buildSignupAttribution,
  classifyChannel,
  classifyPage,
  detectMethod,
  detectPlatform,
  normalizePath,
  normalizeRef,
  parseSignupContext,
  referrerHost,
  summarizeSignupSources,
} from "@/lib/signup-attribution";

const SITE = "le-vestiaire-foot.fr";
const headers = (h: Record<string, string>) => new Headers(h);

describe("parseSignupContext", () => {
  it("lit un contexte JSON valide", () => {
    expect(
      parseSignupContext('{"entryPath":"/jerseys","referrer":"https://www.google.com/","ref":"recap"}')
    ).toEqual({ entryPath: "/jerseys", referrer: "https://www.google.com/", ref: "recap" });
  });

  it("accepte un objet déjà parsé (additionalData de l'état OAuth)", () => {
    expect(parseSignupContext({ entryPath: "/" })).toEqual({ entryPath: "/" });
  });

  it("un JSON invalide donne un contexte vide", () => {
    expect(parseSignupContext("{pas du json")).toEqual({});
  });

  it("un contexte de plus de 2 Ko est ignoré", () => {
    expect(parseSignupContext(JSON.stringify({ entryPath: "/" + "a".repeat(2100) }))).toEqual({});
  });

  it("ne garde que les champs texte connus", () => {
    expect(parseSignupContext({ entryPath: 42, evil: "x", platform: "ios" })).toEqual({ platform: "ios" });
  });

  it("une plateforme inconnue est ignorée", () => {
    expect(parseSignupContext({ platform: "android" })).toEqual({});
  });

  it("absent ou null donne un contexte vide", () => {
    expect(parseSignupContext(null)).toEqual({});
    expect(parseSignupContext(undefined)).toEqual({});
  });
});

describe("normalizePath", () => {
  it("retire query et fragment, qui peuvent porter un jeton ou un e-mail", () => {
    expect(normalizePath("/auth/reset?token=abc#x")).toBe("/auth/reset");
  });

  it("retire le préfixe de langue", () => {
    expect(normalizePath("/en/jerseys/ligue-1")).toBe("/jerseys/ligue-1");
    expect(normalizePath("/de")).toBe("/");
  });

  it("ne confond pas un préfixe de langue avec un début de segment", () => {
    expect(normalizePath("/enfants")).toBe("/enfants");
  });

  it("refuse ce qui n'est pas un chemin interne", () => {
    expect(normalizePath("https://evil.com/x")).toBeNull();
    expect(normalizePath("//evil.com")).toBeNull();
    expect(normalizePath("")).toBeNull();
    expect(normalizePath(undefined)).toBeNull();
  });

  it("coupe à 200 caractères", () => {
    expect(normalizePath("/" + "a".repeat(300))).toHaveLength(200);
  });
});

describe("referrerHost", () => {
  it("ne garde que l'hôte", () => {
    expect(referrerHost("https://www.google.com/search?q=maillot", SITE)).toBe("www.google.com");
  });

  it("notre propre domaine est interne", () => {
    expect(referrerHost("https://le-vestiaire-foot.fr/jerseys", SITE)).toBeNull();
    expect(referrerHost("https://www.le-vestiaire-foot.fr/", SITE)).toBeNull();
  });

  it("une URL invalide ou non http est ignorée", () => {
    expect(referrerHost("pas une url", SITE)).toBeNull();
    expect(referrerHost("android-app://com.google.android.gm/", SITE)).toBeNull();
    expect(referrerHost("", SITE)).toBeNull();
  });
});

describe("normalizeRef", () => {
  it("accepte un ref simple, en minuscules", () => {
    expect(normalizeRef("Recap-2026")).toBe("recap-2026");
    expect(normalizeRef("parrain:abc_12")).toBe("parrain:abc_12");
  });

  it("refuse un format inattendu", () => {
    expect(normalizeRef("<script>")).toBeNull();
    expect(normalizeRef("a".repeat(65))).toBeNull();
    expect(normalizeRef("")).toBeNull();
  });
});

describe("detectPlatform", () => {
  it("l'origine de l'app = iOS", () => {
    expect(detectPlatform(headers({ origin: "levestiaire://app" }), {})).toBe("ios");
  });

  it("l'en-tête de version de l'app = iOS", () => {
    expect(detectPlatform(headers({ "x-app-version": "1.7.1" }), {})).toBe("ios");
  });

  it("le parcours mobile-login se déclare iOS par le contexte", () => {
    expect(detectPlatform(headers({}), { platform: "ios" })).toBe("ios");
  });

  it("sinon web", () => {
    expect(detectPlatform(headers({ origin: "https://le-vestiaire-foot.fr" }), {})).toBe("web");
    expect(detectPlatform(null, {})).toBe("web");
  });
});

describe("detectMethod", () => {
  it("inscription email", () => {
    expect(detectMethod("/sign-up/email", null)).toBe("email");
  });

  it("callback Google (web)", () => {
    expect(detectMethod("/callback/:id", "google")).toBe("google");
  });

  it("idToken natif Google ou Apple", () => {
    expect(detectMethod("/sign-in/social", "google")).toBe("google");
    expect(detectMethod("/sign-in/social", "apple")).toBe("apple");
  });

  it("autre cas = other", () => {
    expect(detectMethod("/admin/create-user", null)).toBe("other");
    expect(detectMethod(undefined, null)).toBe("other");
  });
});

describe("buildSignupAttribution", () => {
  it("assemble une ligne normalisée", () => {
    expect(
      buildSignupAttribution({
        headers: headers({}),
        path: "/sign-up/email",
        provider: null,
        context: {
          entryPath: "/fr/jerseys/ligue-1?x=1",
          referrer: "https://www.google.com/",
          ref: "Recap",
          firstPath: "/jerseys",
        },
        siteHost: SITE,
      })
    ).toEqual({
      platform: "web",
      method: "email",
      entryPath: "/jerseys/ligue-1",
      referrerHost: "www.google.com",
      ref: "recap",
      firstPath: "/jerseys",
    });
  });
});

describe("classifyChannel", () => {
  const row = (r: Partial<Parameters<typeof classifyChannel>[0]>) => ({
    hasAttribution: true,
    platform: "web",
    referrerHost: null,
    ref: null,
    ...r,
  });

  it("le ref l'emporte sur tout", () => {
    expect(classifyChannel(row({ ref: "recap", referrerHost: "www.google.com" }))).toBe("ref:recap");
  });

  it("moteur de recherche", () => {
    expect(classifyChannel(row({ referrerHost: "www.google.fr" }))).toBe("search");
    expect(classifyChannel(row({ referrerHost: "www.qwant.com" }))).toBe("search");
    expect(classifyChannel(row({ referrerHost: "duckduckgo.com" }))).toBe("search");
  });

  it("réseau social", () => {
    expect(classifyChannel(row({ referrerHost: "l.instagram.com" }))).toBe("social");
    expect(classifyChannel(row({ referrerHost: "t.co" }))).toBe("social");
  });

  it("autre site", () => {
    expect(classifyChannel(row({ referrerHost: "forum.example.org" }))).toBe("other_site");
  });

  it("sans référent : direct sur le web, app sur iOS", () => {
    expect(classifyChannel(row({}))).toBe("direct");
    expect(classifyChannel(row({ platform: "ios" }))).toBe("app");
  });

  it("sans ligne : inconnu", () => {
    expect(classifyChannel(row({ hasAttribution: false }))).toBe("unknown");
  });
});

describe("classifyPage", () => {
  it("reconnaît les pages du catalogue", () => {
    expect(classifyPage("/jerseys/ligue-1/clubs/psg/jerseys/maillot-psg-home-2025")).toBe("jersey");
    expect(classifyPage("/jerseys/ligue-1/clubs/psg")).toBe("club");
    expect(classifyPage("/jerseys/ligue-1")).toBe("catalog");
    expect(classifyPage("/jerseys")).toBe("catalog");
  });

  it("reconnaît les autres pages", () => {
    expect(classifyPage("/")).toBe("home");
    expect(classifyPage("/u/nathan")).toBe("profile");
    expect(classifyPage("/w/abc123def456")).toBe("shared_wishlist");
    expect(classifyPage("/auth/signUp")).toBe("auth");
    expect(classifyPage("/leaderboard")).toBe("other");
    expect(classifyPage(null)).toBe("none");
  });
});

describe("summarizeSignupSources", () => {
  it("compte par canal et par type de page, du plus grand au plus petit", () => {
    const summary = summarizeSignupSources([
      { hasAttribution: true, platform: "web", referrerHost: "www.google.com", ref: null, entryPath: "/jerseys/l1/clubs/psg/jerseys/x", firstPath: null },
      { hasAttribution: true, platform: "web", referrerHost: "www.google.com", ref: null, entryPath: "/jerseys/l1/clubs/psg/jerseys/y", firstPath: "/jerseys/l1" },
      { hasAttribution: true, platform: "ios", referrerHost: null, ref: null, entryPath: null, firstPath: null },
      { hasAttribution: false, platform: null, referrerHost: null, ref: null, entryPath: null, firstPath: null },
    ]);

    expect(summary.total).toBe(4);
    expect(summary.channels).toEqual([
      { key: "search", count: 2 },
      { key: "app", count: 1 },
      { key: "unknown", count: 1 },
    ]);
    // La première page vue (avec consentement) prime sur la page d'où part l'inscription
    expect(summary.pages).toEqual([
      { key: "jersey", count: 1 },
      { key: "catalog", count: 1 },
    ]);
    expect(summary.topPaths).toEqual([
      { key: "/jerseys/l1/clubs/psg/jerseys/x", count: 1 },
      { key: "/jerseys/l1", count: 1 },
    ]);
  });
});
