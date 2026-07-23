import { describe, it, expect, beforeEach } from "vitest";
import { createTestUser } from "@/__tests__/helpers/fixtures";
import { cleanDatabase, prismaTest } from "@/__tests__/helpers/db";
import "@/__tests__/setup.integration";
import { getFeedForUser, computeBoost } from "./get-feed";

describe("computeBoost", () => {
  it("retourne 0 pour un post sans engagement", () => {
    expect(computeBoost(0, 0)).toBe(0);
  });

  it("retourne likes*3600 + comments*7200", () => {
    expect(computeBoost(2, 1)).toBe(2 * 3600 + 1 * 7200);
  });

  it("cap à 86400 (1 jour) même si engagement fort", () => {
    expect(computeBoost(100, 100)).toBe(86400);
  });
});

describe("getFeedForUser", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("retourne les posts des users suivis, ordre chronologique décroissant", async () => {
    const me = await createTestUser();
    const alice = await createTestUser();
    const bob = await createTestUser();

    // Je suis Alice et Bob
    await prismaTest.follow.create({
      data: { followerId: me.id, followingId: alice.id },
    });
    await prismaTest.follow.create({
      data: { followerId: me.id, followingId: bob.id },
    });

    const oldPost = await prismaTest.post.create({
      data: {
        authorId: alice.id,
        type: "CAP_REACHED",
        capKind: "COLLECTION_50",
        createdAt: new Date("2026-07-10T10:00:00Z"),
      },
    });
    const newPost = await prismaTest.post.create({
      data: {
        authorId: bob.id,
        type: "CAP_REACHED",
        capKind: "COLLECTION_100",
        createdAt: new Date("2026-07-19T10:00:00Z"),
      },
    });

    const result = await getFeedForUser(me.id, { limit: 20 });
    expect(result.items.map((p) => p.id)).toEqual([newPost.id, oldPost.id]);
  });

  it("n'inclut pas les posts d'users non suivis", async () => {
    const me = await createTestUser();
    const stranger = await createTestUser();

    await prismaTest.post.create({
      data: {
        authorId: stranger.id,
        type: "CAP_REACHED",
        capKind: "COLLECTION_50",
      },
    });

    const result = await getFeedForUser(me.id, { limit: 20 });
    expect(result.items).toHaveLength(0);
  });

  it("exclut les posts d'un user bloqué (dans les deux sens)", async () => {
    const me = await createTestUser();
    const alice = await createTestUser();

    await prismaTest.follow.create({
      data: { followerId: me.id, followingId: alice.id },
    });
    await prismaTest.block.create({
      data: { blockerId: me.id, blockedId: alice.id },
    });

    await prismaTest.post.create({
      data: {
        authorId: alice.id,
        type: "CAP_REACHED",
        capKind: "COLLECTION_100",
      },
    });

    const result = await getFeedForUser(me.id, { limit: 20 });
    expect(result.items).toHaveLength(0);
  });

  it("exclut les posts soft-deleted", async () => {
    const me = await createTestUser();
    const alice = await createTestUser();

    await prismaTest.follow.create({
      data: { followerId: me.id, followingId: alice.id },
    });
    await prismaTest.post.create({
      data: {
        authorId: alice.id,
        type: "CAP_REACHED",
        capKind: "COLLECTION_50",
        deletedAt: new Date(),
      },
    });

    const result = await getFeedForUser(me.id, { limit: 20 });
    expect(result.items).toHaveLength(0);
  });

  it("pagine via cursor (limit 2, retourne nextCursor)", async () => {
    const me = await createTestUser();
    const alice = await createTestUser();

    await prismaTest.follow.create({
      data: { followerId: me.id, followingId: alice.id },
    });

    for (let i = 0; i < 3; i++) {
      await prismaTest.post.create({
        data: {
          authorId: alice.id,
          type: "CAP_REACHED",
          capKind: i === 0 ? "COLLECTION_50" : i === 1 ? "COLLECTION_100" : "COLLECTION_500",
          createdAt: new Date(2026, 6, 10 + i, 10, 0, 0),
        },
      });
    }

    const page1 = await getFeedForUser(me.id, { limit: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await getFeedForUser(me.id, {
      limit: 2,
      cursor: page1.nextCursor!,
    });
    expect(page2.items).toHaveLength(1);
    expect(page2.nextCursor).toBeNull();
  });
});
