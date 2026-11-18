import { describe, expect, it } from "vitest";
import { prismaTest } from "@/__tests__/helpers/db";
import { createTestUser } from "@/__tests__/helpers/fixtures";
import { getSignupSources } from "@/lib/admin/kpi";
import "@/__tests__/setup.integration";

const DAY = 86_400_000;
const NOW = new Date("2026-11-18T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);
const lastWeek = { start: daysAgo(7), end: NOW };

describe("getSignupSources", () => {
  it("répartit les inscrits de la période, sans staff ni hors période, inconnus compris", async () => {
    const google = await createTestUser({ createdAt: daysAgo(1) });
    const recap = await createTestUser({ createdAt: daysAgo(2) });
    await createTestUser({ createdAt: daysAgo(3) }); // ancien compte, sans ligne
    const admin = await createTestUser({ createdAt: daysAgo(1), role: "admin" });
    const old = await createTestUser({ createdAt: daysAgo(30) });

    await prismaTest.signupAttribution.createMany({
      data: [
        { userId: google.id, platform: "web", method: "google", referrerHost: "www.google.com", entryPath: "/jerseys/l1/clubs/psg/jerseys/x" },
        { userId: recap.id, platform: "web", method: "email", ref: "recap", entryPath: "/w/abc" },
        { userId: admin.id, platform: "web", method: "email", referrerHost: "www.google.com" },
        { userId: old.id, platform: "web", method: "email", referrerHost: "www.google.com" },
      ],
    });

    const summary = await getSignupSources(lastWeek, "all");

    expect(summary.total).toBe(3);
    expect(summary.channels).toEqual(
      expect.arrayContaining([
        { key: "search", count: 1 },
        { key: "ref:recap", count: 1 },
        { key: "unknown", count: 1 },
      ])
    );
    expect(summary.pages).toEqual(
      expect.arrayContaining([
        { key: "jersey", count: 1 },
        { key: "shared_wishlist", count: 1 },
      ])
    );
  });
});
