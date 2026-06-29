import { describe, it, expect } from "vitest";
import {
  AUTH_GATE_INTENTS,
  isValidReturnTo,
  buildReturnTo,
  buildAuthUrl,
  parsePendingIntent,
} from "@/lib/auth-gate";

describe("isValidReturnTo", () => {
  it("accepts internal absolute paths", () => {
    expect(isValidReturnTo("/fr/jerseys/123")).toBe(true);
    expect(isValidReturnTo("/")).toBe(true);
  });

  it("rejects null and empty", () => {
    expect(isValidReturnTo(null)).toBe(false);
    expect(isValidReturnTo("")).toBe(false);
    expect(isValidReturnTo(undefined)).toBe(false);
  });

  it("rejects protocol-relative URLs", () => {
    expect(isValidReturnTo("//evil.com")).toBe(false);
  });

  it("rejects absolute URLs with protocol", () => {
    expect(isValidReturnTo("http://evil.com")).toBe(false);
    expect(isValidReturnTo("https://evil.com")).toBe(false);
    expect(isValidReturnTo("javascript:alert(1)")).toBe(false);
  });

  it("rejects relative paths without leading slash", () => {
    expect(isValidReturnTo("jerseys/123")).toBe(false);
  });
});

describe("buildReturnTo", () => {
  it("appends intent as query param on path without existing query", () => {
    expect(buildReturnTo("/fr/jerseys/abc", "add_collection")).toBe(
      "/fr/jerseys/abc?intent=add_collection"
    );
  });

  it("appends intent to path with existing query params", () => {
    expect(buildReturnTo("/fr/jerseys/abc?page=2", "add_wishlist")).toBe(
      "/fr/jerseys/abc?page=2&intent=add_wishlist"
    );
  });

  it("replaces an existing intent param", () => {
    expect(buildReturnTo("/fr/jerseys/abc?intent=report", "add_collection")).toBe(
      "/fr/jerseys/abc?intent=add_collection"
    );
  });
});

describe("buildAuthUrl", () => {
  it("encodes returnTo in query param", () => {
    const url = buildAuthUrl("signUp", "/fr/jerseys/abc?intent=add_collection");
    expect(url).toBe(
      "/auth/signUp?returnTo=%2Ffr%2Fjerseys%2Fabc%3Fintent%3Dadd_collection"
    );
  });

  it("builds login URL", () => {
    expect(buildAuthUrl("login", "/fr/x")).toBe("/auth/login?returnTo=%2Ffr%2Fx");
  });
});

describe("parsePendingIntent", () => {
  it("returns valid intent from search params", () => {
    const params = new URLSearchParams("?intent=add_collection");
    expect(parsePendingIntent(params)).toBe("add_collection");
  });

  it("returns null for unknown intent", () => {
    const params = new URLSearchParams("?intent=foobar");
    expect(parsePendingIntent(params)).toBeNull();
  });

  it("returns null when intent missing", () => {
    expect(parsePendingIntent(new URLSearchParams(""))).toBeNull();
  });

  it("returns add_wishlist and report intents", () => {
    expect(parsePendingIntent(new URLSearchParams("?intent=add_wishlist"))).toBe("add_wishlist");
    expect(parsePendingIntent(new URLSearchParams("?intent=report"))).toBe("report");
  });
});

describe("AUTH_GATE_INTENTS", () => {
  it("exposes the 3 supported intents", () => {
    expect(AUTH_GATE_INTENTS).toEqual(["add_collection", "add_wishlist", "report"]);
  });
});
