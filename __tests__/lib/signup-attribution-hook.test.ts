import { describe, expect, it, vi } from "vitest";
import {
  captureSignupAttribution,
  saveSignupAttribution,
  type SignupAttributionDeps,
} from "@/lib/signup-attribution-hook";

function makeDeps(oauthState: Record<string, unknown> | null = null) {
  const save = vi.fn<SignupAttributionDeps["save"]>().mockResolvedValue();
  const deps: SignupAttributionDeps = {
    readOAuthState: async () => oauthState,
    save,
    siteHost: "le-vestiaire-foot.fr",
  };
  return { deps, save };
}

describe("source d'inscription dans les hooks Better Auth", () => {
  it("email web : lit l'en-tête de contexte", async () => {
    const { deps, save } = makeDeps();
    const ctx = {
      path: "/sign-up/email",
      headers: new Headers({
        "x-signup-context": JSON.stringify({ entryPath: "/fr/w/abc", referrer: "https://www.google.com/", ref: "recap" }),
      }),
    };
    await captureSignupAttribution(ctx, deps);
    await saveSignupAttribution("u1", ctx, deps);
    expect(save).toHaveBeenCalledWith("u1", {
      platform: "web",
      method: "email",
      entryPath: "/w/abc",
      referrerHost: "www.google.com",
      ref: "recap",
      firstPath: null,
    });
  });

  it("Google web : lit additionalData dans l'état OAuth au callback", async () => {
    const { deps, save } = makeDeps({ signupContext: { entryPath: "/jerseys", ref: "test" } });
    const ctx = { path: "/callback/:id", params: { id: "google" }, headers: new Headers() };
    await captureSignupAttribution(ctx, deps);
    await saveSignupAttribution("u2", ctx, deps);
    expect(save).toHaveBeenCalledWith("u2", expect.objectContaining({ method: "google", entryPath: "/jerseys", ref: "test" }));
  });

  it("Apple iOS : plateforme par l'origine de l'app, méthode par le provider", async () => {
    const { deps, save } = makeDeps();
    const ctx = { path: "/sign-in/social", body: { provider: "apple" }, headers: new Headers({ origin: "levestiaire://app" }) };
    await captureSignupAttribution(ctx, deps);
    await saveSignupAttribution("u3", ctx, deps);
    expect(save).toHaveBeenCalledWith("u3", expect.objectContaining({ platform: "ios", method: "apple" }));
  });

  it("sans contexte de requête (script, admin) : rien n'est écrit", async () => {
    const { deps, save } = makeDeps();
    await captureSignupAttribution(null, deps);
    await saveSignupAttribution("u4", null, deps);
    expect(save).not.toHaveBeenCalled();
  });

  it("une erreur d'écriture ne remonte jamais", async () => {
    const { deps } = makeDeps();
    deps.save = vi.fn().mockRejectedValue(new Error("db down"));
    const ctx = { path: "/sign-up/email", headers: new Headers() };
    vi.spyOn(console, "error").mockImplementation(() => {});
    await captureSignupAttribution(ctx, deps);
    await expect(saveSignupAttribution("u5", ctx, deps)).resolves.toBeUndefined();
  });

  it("un état OAuth illisible n'empêche pas l'enregistrement", async () => {
    const { deps, save } = makeDeps();
    deps.readOAuthState = async () => {
      throw new Error("hors requête");
    };
    const ctx = { path: "/sign-up/email", headers: new Headers() };
    await captureSignupAttribution(ctx, deps);
    await saveSignupAttribution("u6", ctx, deps);
    expect(save).toHaveBeenCalledWith("u6", expect.objectContaining({ method: "email" }));
  });
});
