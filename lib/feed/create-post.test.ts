import { describe, it, expect, beforeEach } from "vitest";
import { createTestUser } from "@/__tests__/helpers/fixtures";
import { cleanDatabase, prismaTest } from "@/__tests__/helpers/db";
import "@/__tests__/setup.integration";
import { createFeedPost } from "./create-post";

describe("createFeedPost", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("crée un Post de type JERSEY_ADD avec referenceId", async () => {
    const user = await createTestUser();
    const jersey = await prismaTest.jersey.findFirst({ select: { id: true } });
    if (!jersey) throw new Error("DB dev doit avoir au moins un jersey");
    const userJersey = await prismaTest.userJersey.create({
      data: { userId: user.id, jerseyId: jersey.id, condition: "GOOD" },
    });

    const post = await createFeedPost({
      authorId: user.id,
      type: "JERSEY_ADD",
      referenceId: userJersey.id,
    });

    expect(post).not.toBeNull();
    expect(post!.type).toBe("JERSEY_ADD");
    expect(post!.referenceId).toBe(userJersey.id);
    expect(post!.authorId).toBe(user.id);
  });

  it("crée un Post de type ACHIEVEMENT_UNLOCK", async () => {
    const user = await createTestUser();
    const achievement = await prismaTest.achievement.create({
      data: {
        userId: user.id,
        key: "collection.250",
        category: "COLLECTION",
        tier: "PLATINUM",
      },
    });

    const post = await createFeedPost({
      authorId: user.id,
      type: "ACHIEVEMENT_UNLOCK",
      referenceId: achievement.id,
    });

    expect(post).not.toBeNull();
    expect(post!.type).toBe("ACHIEVEMENT_UNLOCK");
    expect(post!.referenceId).toBe(achievement.id);
  });

  it("crée un Post de type CAP_REACHED avec capKind", async () => {
    const user = await createTestUser();

    const post = await createFeedPost({
      authorId: user.id,
      type: "CAP_REACHED",
      capKind: "COLLECTION_100",
    });

    expect(post).not.toBeNull();
    expect(post!.type).toBe("CAP_REACHED");
    expect(post!.capKind).toBe("COLLECTION_100");
    expect(post!.referenceId).toBeNull();
  });

  it("est idempotent : deux appels avec même (authorId + type + referenceId) ne créent qu'un post", async () => {
    const user = await createTestUser();
    const jersey = await prismaTest.jersey.findFirst({ select: { id: true } });
    if (!jersey) throw new Error("DB dev doit avoir au moins un jersey");
    const userJersey = await prismaTest.userJersey.create({
      data: { userId: user.id, jerseyId: jersey.id, condition: "GOOD" },
    });

    const first = await createFeedPost({
      authorId: user.id,
      type: "JERSEY_ADD",
      referenceId: userJersey.id,
    });
    const second = await createFeedPost({
      authorId: user.id,
      type: "JERSEY_ADD",
      referenceId: userJersey.id,
    });

    expect(first?.id).toBe(second?.id);
    const count = await prismaTest.post.count({
      where: {
        authorId: user.id,
        type: "JERSEY_ADD",
        referenceId: userJersey.id,
      },
    });
    expect(count).toBe(1);
  });

  it("est idempotent pour un cap (deux fois COLLECTION_50 = 1 post)", async () => {
    const user = await createTestUser();
    await createFeedPost({
      authorId: user.id,
      type: "CAP_REACHED",
      capKind: "COLLECTION_50",
    });
    await createFeedPost({
      authorId: user.id,
      type: "CAP_REACHED",
      capKind: "COLLECTION_50",
    });

    const count = await prismaTest.post.count({
      where: {
        authorId: user.id,
        type: "CAP_REACHED",
        capKind: "COLLECTION_50",
      },
    });
    expect(count).toBe(1);
  });

  it("accepte un createdAtOverride pour le backfill", async () => {
    const user = await createTestUser();
    const jersey = await prismaTest.jersey.findFirst({ select: { id: true } });
    if (!jersey) throw new Error("DB dev doit avoir au moins un jersey");
    const userJersey = await prismaTest.userJersey.create({
      data: { userId: user.id, jerseyId: jersey.id, condition: "GOOD" },
    });

    const targetDate = new Date("2026-07-01T12:00:00Z");
    const post = await createFeedPost({
      authorId: user.id,
      type: "JERSEY_ADD",
      referenceId: userJersey.id,
      createdAtOverride: targetDate,
    });

    expect(post!.createdAt.toISOString()).toBe(targetDate.toISOString());
  });
});
