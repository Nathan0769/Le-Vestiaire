import { describe, expect, it } from "vitest";
import { prismaTest } from "@/__tests__/helpers/db";
import { createTestUser } from "@/__tests__/helpers/fixtures";
import { purgeExpiredSignupAttributions } from "@/lib/data-purge";
import "@/__tests__/setup.integration";

const NOW = new Date("2026-12-01T03:10:00Z");

async function attributionAt(createdAt: Date) {
  const user = await createTestUser();
  await prismaTest.signupAttribution.create({
    data: { userId: user.id, platform: "web", method: "email", createdAt },
  });
  return user.id;
}

describe("purgeExpiredSignupAttributions", () => {
  it("supprime les sources de plus de 25 mois et garde les autres", async () => {
    const expired = await attributionAt(new Date("2024-10-31T00:00:00Z"));
    const kept = await attributionAt(new Date("2024-11-02T00:00:00Z"));

    const deleted = await purgeExpiredSignupAttributions(NOW);

    expect(deleted).toBe(1);
    const remaining = await prismaTest.signupAttribution.findMany({ select: { userId: true } });
    expect(remaining.map((r) => r.userId)).toEqual([kept]);
    // Le compte, lui, reste
    expect(await prismaTest.user.findUnique({ where: { id: expired } })).not.toBeNull();
  });
});
