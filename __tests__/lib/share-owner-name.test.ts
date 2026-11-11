import { describe, it, expect } from "vitest";
import { shareOwnerName } from "@/lib/share-owner-name";

describe("shareOwnerName", () => {
  it("prend le prénom : la famille le reconnaît mieux que le pseudo", () => {
    expect(shareOwnerName("Nathan Rivollier", "atox7")).toBe("Nathan");
  });

  it("sans nom, prend le pseudo", () => {
    expect(shareOwnerName("  ", "atox7")).toBe("@atox7");
  });

  it("ignore un nom qui est une adresse e-mail", () => {
    expect(shareOwnerName("nathan@icloud.com", "atox7")).toBe("@atox7");
  });

  it("ni nom ni pseudo : null", () => {
    expect(shareOwnerName("", null)).toBeNull();
  });
});
