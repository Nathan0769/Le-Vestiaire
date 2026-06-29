import { describe, it, expect } from "vitest";
import {
  socialLinksSchema,
  buildSocialUrl,
  SOCIAL_NETWORKS,
} from "@/lib/social-links";

describe("socialLinksSchema", () => {
  it("accepts valid handles for all networks", () => {
    const result = socialLinksSchema.safeParse({
      instagramHandle: "nathan.str",
      twitterHandle: "nathan_str",
      tiktokHandle: "nathan.str",
      youtubeHandle: "@nathanstr",
      twitchHandle: "nathan_str",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null and empty values (deletion)", () => {
    const result = socialLinksSchema.safeParse({
      instagramHandle: null,
      twitterHandle: "",
    });
    expect(result.success).toBe(true);
  });

  it("normalizes empty string to null", () => {
    const result = socialLinksSchema.safeParse({ instagramHandle: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.instagramHandle).toBeNull();
    }
  });

  it("rejects instagram handle with spaces", () => {
    const result = socialLinksSchema.safeParse({
      instagramHandle: "nathan str",
    });
    expect(result.success).toBe(false);
  });

  it("rejects twitter handle longer than 15 chars", () => {
    const result = socialLinksSchema.safeParse({
      twitterHandle: "a".repeat(16),
    });
    expect(result.success).toBe(false);
  });

  it("rejects tiktok handle with @ prefix", () => {
    const result = socialLinksSchema.safeParse({ tiktokHandle: "@nathan" });
    expect(result.success).toBe(false);
  });

  it("accepts youtube handle with or without @", () => {
    expect(
      socialLinksSchema.safeParse({ youtubeHandle: "@nathan" }).success,
    ).toBe(true);
    expect(
      socialLinksSchema.safeParse({ youtubeHandle: "nathan" }).success,
    ).toBe(true);
  });

  it("rejects twitch handle shorter than 4 chars", () => {
    const result = socialLinksSchema.safeParse({ twitchHandle: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("buildSocialUrl", () => {
  it("builds instagram URL without @", () => {
    expect(buildSocialUrl("instagram", "nathanstr")).toBe(
      "https://www.instagram.com/nathanstr",
    );
  });

  it("builds tiktok URL with @ prefix", () => {
    expect(buildSocialUrl("tiktok", "nathanstr")).toBe(
      "https://www.tiktok.com/@nathanstr",
    );
  });

  it("strips leading @ from youtube handle before building URL", () => {
    expect(buildSocialUrl("youtube", "@nathanstr")).toBe(
      "https://www.youtube.com/@nathanstr",
    );
    expect(buildSocialUrl("youtube", "nathanstr")).toBe(
      "https://www.youtube.com/@nathanstr",
    );
  });

  it("builds twitter URL on x.com", () => {
    expect(buildSocialUrl("twitter", "nathanstr")).toBe(
      "https://x.com/nathanstr",
    );
  });

  it("builds twitch URL", () => {
    expect(buildSocialUrl("twitch", "nathanstr")).toBe(
      "https://www.twitch.tv/nathanstr",
    );
  });
});

describe("SOCIAL_NETWORKS", () => {
  it("exposes 5 networks", () => {
    expect(SOCIAL_NETWORKS).toHaveLength(5);
  });

  it("has unique keys for each network", () => {
    const keys = SOCIAL_NETWORKS.map((n) => n.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
