import { describe, it, expect, afterAll } from "vitest";
import prisma from "@/lib/prisma";
import { checkAchievements } from "@/lib/achievements/check";

const TEST_EMAIL_PREFIX = "__test_achievements_check_";

async function createTestUser(suffix: string) {
  return prisma.user.create({
    data: {
      email: `${TEST_EMAIL_PREFIX}${suffix}@test.local`,
      name: `Test ${suffix}`,
      username: `test_check_${suffix}_${Date.now()}`,
    },
  });
}

describe("checkAchievements", () => {
  const cleanup: string[] = [];

  afterAll(async () => {
    if (cleanup.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: cleanup } } });
    }
  });

  it("unlock un succès quand le seuil est atteint", async () => {
    const user = await createTestUser("unlock");
    cleanup.push(user.id);

    const jersey = await prisma.jersey.findFirst({ select: { id: true } });
    if (!jersey) throw new Error("DB de dev doit avoir un jersey");
    await prisma.userJersey.create({
      data: { userId: user.id, jerseyId: jersey.id, condition: "GOOD" },
    });

    const newUnlocks = await checkAchievements(user.id, "collection.add");
    const keys = newUnlocks.map((u) => u.key);
    expect(keys).toContain("collection.first");
  });

  it("ne double-unlock pas un succès déjà obtenu", async () => {
    const user = await createTestUser("no_dup");
    cleanup.push(user.id);

    const jersey = await prisma.jersey.findFirst({ select: { id: true } });
    if (!jersey) throw new Error("DB de dev doit avoir un jersey");
    await prisma.userJersey.create({
      data: { userId: user.id, jerseyId: jersey.id, condition: "GOOD" },
    });

    await checkAchievements(user.id, "collection.add");
    const second = await checkAchievements(user.id, "collection.add");
    expect(second.find((u) => u.key === "collection.first")).toBeUndefined();

    const dbCount = await prisma.achievement.count({
      where: { userId: user.id, key: "collection.first" },
    });
    expect(dbCount).toBe(1);
  });

  it("unlock plusieurs succès en une passe quand plusieurs seuils sont atteints", async () => {
    const user = await createTestUser("multi");
    cleanup.push(user.id);

    const jerseys = await prisma.jersey.findMany({
      distinct: ["clubId"],
      take: 10,
      select: { id: true },
    });
    for (const j of jerseys) {
      await prisma.userJersey.create({
        data: { userId: user.id, jerseyId: j.id, condition: "GOOD" },
      });
    }

    const newUnlocks = await checkAchievements(user.id, "collection.add");
    const keys = newUnlocks.map((u) => u.key);
    expect(keys).toContain("collection.first");
    expect(keys).toContain("collection.10");
    expect(keys).toContain("diversity.clubs.5");
  });

  it("n'unlock rien si progress < threshold", async () => {
    const user = await createTestUser("no_unlock");
    cleanup.push(user.id);

    const newUnlocks = await checkAchievements(user.id, "collection.add");
    expect(newUnlocks.find((u) => u.key === "collection.first")).toBeUndefined();
  });

  it("ignore les définitions n'écoutant pas le trigger fourni", async () => {
    const user = await createTestUser("ignore_trigger");
    cleanup.push(user.id);

    const otherUser = await createTestUser("ignore_friend");
    cleanup.push(otherUser.id);
    await prisma.friendship.create({
      data: { senderId: user.id, receiverId: otherUser.id, status: "ACCEPTED" },
    });

    const newUnlocks = await checkAchievements(user.id, "collection.add");
    expect(newUnlocks.find((u) => u.key === "social.friend.first")).toBeUndefined();
  });

  it("stocke le progress dans metadata au moment de l'unlock", async () => {
    const user = await createTestUser("meta");
    cleanup.push(user.id);

    const jersey = await prisma.jersey.findFirst({ select: { id: true } });
    if (!jersey) throw new Error("DB de dev doit avoir un jersey");
    await prisma.userJersey.create({
      data: { userId: user.id, jerseyId: jersey.id, condition: "GOOD" },
    });

    const newUnlocks = await checkAchievements(user.id, "collection.add");
    const unlock = newUnlocks.find((u) => u.key === "collection.first");
    expect(unlock).toBeDefined();
    expect((unlock!.metadata as { progress: number }).progress).toBeGreaterThanOrEqual(1);
  });

  it("gère la contrainte unique en cas de race sans throw", async () => {
    const user = await createTestUser("race");
    cleanup.push(user.id);

    const jersey = await prisma.jersey.findFirst({ select: { id: true } });
    if (!jersey) throw new Error("DB de dev doit avoir un jersey");
    await prisma.userJersey.create({
      data: { userId: user.id, jerseyId: jersey.id, condition: "GOOD" },
    });

    const [a, b] = await Promise.all([
      checkAchievements(user.id, "collection.add"),
      checkAchievements(user.id, "collection.add"),
    ]);

    const total = a.length + b.length;
    // Peut être 1 (une passe voit l'autre déjà unlock) ou 2 (les deux voient rien) mais jamais throw
    expect(total).toBeGreaterThanOrEqual(0);

    const dbRows = await prisma.achievement.findMany({
      where: { userId: user.id, key: "collection.first" },
    });
    expect(dbRows.length).toBe(1);
  });
});
