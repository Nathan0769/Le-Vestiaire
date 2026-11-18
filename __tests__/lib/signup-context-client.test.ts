import { describe, expect, it } from "vitest";
import { buildSignupContext } from "@/lib/signup-context-client";

const base = { pathname: "/fr/auth/signUp", search: "", referrer: "", returnTo: null, firstPath: null };

describe("buildSignupContext", () => {
  it("la page d'entrée est returnTo quand il est valide", () => {
    expect(buildSignupContext({ ...base, returnTo: "/fr/jerseys/x?intent=add_wishlist" }).entryPath).toBe(
      "/fr/jerseys/x?intent=add_wishlist"
    );
  });

  it("sinon la page courante, et un returnTo externe est ignoré", () => {
    expect(buildSignupContext(base).entryPath).toBe("/fr/auth/signUp");
    expect(buildSignupContext({ ...base, returnTo: "https://evil.com" }).entryPath).toBe("/fr/auth/signUp");
  });

  it("ref : URL courante d'abord, puis returnTo", () => {
    expect(buildSignupContext({ ...base, search: "?ref=recap" }).ref).toBe("recap");
    expect(buildSignupContext({ ...base, returnTo: "/w/abc?ref=wishlist" }).ref).toBe("wishlist");
    expect(buildSignupContext(base).ref).toBeUndefined();
  });

  it("transmet le référent et la première page seulement s'ils existent", () => {
    expect(buildSignupContext({ ...base, referrer: "https://www.google.com/", firstPath: "/jerseys" })).toEqual({
      entryPath: "/fr/auth/signUp",
      referrer: "https://www.google.com/",
      firstPath: "/jerseys",
    });
    expect(buildSignupContext(base)).toEqual({ entryPath: "/fr/auth/signUp" });
  });
});
