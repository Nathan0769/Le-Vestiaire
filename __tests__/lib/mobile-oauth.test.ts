import { describe, expect, it } from "vitest";
import {
  GOOGLE_IOS_CLIENT_ID,
  googleClientIds,
  mobileLoginSignInBody,
  nativeBridgeLocation,
} from "@/lib/mobile-oauth";

const BRIDGE = "https://le-vestiaire-foot.fr/api/auth/native-bridge";

describe("mobileLoginSignInBody", () => {
  it("au premier essai, une erreur Google relance la connexion au lieu d'ouvrir le site", () => {
    const body = mobileLoginSignInBody("google", false);
    expect(body.errorCallbackURL).toBe(
      "https://le-vestiaire-foot.fr/api/auth/mobile-login?provider=google&retry=1",
    );
  });

  it("à la relance, une nouvelle erreur revient à l'app par le pont natif", () => {
    expect(mobileLoginSignInBody("google", true).errorCallbackURL).toBe(BRIDGE);
  });

  it("le succès passe toujours par le pont natif", () => {
    expect(mobileLoginSignInBody("google", false).callbackURL).toBe(BRIDGE);
  });

  it("un provider inattendu retombe sur google", () => {
    expect(mobileLoginSignInBody("goo<script>", false).provider).toBe("google");
  });
});

describe("nativeBridgeLocation", () => {
  it("renvoie le token de session à l'app", () => {
    expect(nativeBridgeLocation({ token: "abc", error: null })).toBe("levestiaire://auth?token=abc");
  });

  it("transmet le code d'erreur Better Auth à l'app (la feuille se ferme)", () => {
    expect(nativeBridgeLocation({ token: null, error: "state_mismatch" })).toBe(
      "levestiaire://auth?error=state_mismatch",
    );
  });

  it("une erreur prime sur une session Safari existante (autre compte possible)", () => {
    expect(nativeBridgeLocation({ token: "abc", error: "state_mismatch" })).toBe(
      "levestiaire://auth?error=state_mismatch",
    );
  });

  it("un code d'erreur bizarre est remplacé par un code neutre", () => {
    expect(nativeBridgeLocation({ token: null, error: "x&token=evil" })).toBe(
      "levestiaire://auth?error=oauth",
    );
  });

  it("sans session ni erreur : nosession", () => {
    expect(nativeBridgeLocation({ token: null, error: null })).toBe("levestiaire://auth?error=nosession");
  });
});

describe("googleClientIds", () => {
  it("le client web reste le premier (il signe l'URL d'autorisation du site)", () => {
    expect(googleClientIds("web-id")[0]).toBe("web-id");
  });

  it("accepte aussi les jetons émis pour l'app iOS", () => {
    expect(googleClientIds("web-id", "ios-id")).toEqual(["web-id", "ios-id"]);
  });

  it("sans ID iOS renseigné, seul le client web est accepté", () => {
    expect(googleClientIds("web-id", "")).toEqual(["web-id"]);
  });

  it("l'ID iOS par défaut a le format Google ou est vide", () => {
    expect(GOOGLE_IOS_CLIENT_ID).toMatch(/^$|^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/);
  });
});
