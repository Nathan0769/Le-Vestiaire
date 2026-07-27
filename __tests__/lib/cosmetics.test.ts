import { describe, it, expect } from "vitest";
import {
  FRAMES,
  BANNERS,
  isValidFrame,
  isValidBanner,
  getAvatarFrameClass,
  getBannerClass,
} from "@/lib/cosmetics";

describe("cosmetics catalog", () => {
  it("exposes the three frames and three banners", () => {
    expect(Object.keys(FRAMES)).toHaveLength(3);
    expect(Object.keys(BANNERS)).toHaveLength(3);
  });
});

describe("isValidFrame / isValidBanner", () => {
  it("accepts known keys", () => {
    expect(isValidFrame("gold-foil")).toBe(true);
    expect(isValidBanner("atelier")).toBe(true);
  });

  it("rejects unknown keys and nullish", () => {
    expect(isValidFrame("does-not-exist")).toBe(false);
    expect(isValidBanner("does-not-exist")).toBe(false);
    expect(isValidFrame(null)).toBe(false);
    expect(isValidBanner(undefined)).toBe(false);
  });
});

describe("getAvatarFrameClass", () => {
  it("returns the frame class for an active supporter with a valid frame", () => {
    expect(getAvatarFrameClass("gold-foil", true)).toBe(
      FRAMES["gold-foil"].className
    );
  });

  it("returns empty string when the user is not a supporter", () => {
    expect(getAvatarFrameClass("gold-foil", false)).toBe("");
  });

  it("returns empty string for an invalid or null frame", () => {
    expect(getAvatarFrameClass("nope", true)).toBe("");
    expect(getAvatarFrameClass(null, true)).toBe("");
  });
});

describe("getBannerClass", () => {
  it("returns the banner class only for an active supporter", () => {
    expect(getBannerClass("atelier", true)).toBe(BANNERS.atelier.className);
    expect(getBannerClass("atelier", false)).toBe("");
  });
});
