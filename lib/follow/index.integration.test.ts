import { describe, it, expect, beforeEach } from "vitest";
import { createTestUser } from "@/__tests__/helpers/fixtures";
import { cleanDatabase } from "@/__tests__/helpers/db";
import "@/__tests__/setup.integration";
import {
  isFollowing,
  isBlocked,
  canInteract,
  getFollowersCount,
  getFollowingIds,
  getBlockedIdsBothWays,
} from "./index";
import { prismaTest } from "@/__tests__/helpers/db";

describe("isFollowing", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("retourne true si un Follow existe entre A et B", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    await prismaTest.follow.create({
      data: { followerId: alice.id, followingId: bob.id },
    });

    expect(await isFollowing(alice.id, bob.id, prismaTest)).toBe(true);
  });

  it("retourne false si aucun Follow n'existe", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();

    expect(await isFollowing(alice.id, bob.id, prismaTest)).toBe(false);
  });

  it("est unidirectionnel : A suit B ne signifie pas B suit A", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    await prismaTest.follow.create({
      data: { followerId: alice.id, followingId: bob.id },
    });

    expect(await isFollowing(alice.id, bob.id, prismaTest)).toBe(true);
    expect(await isFollowing(bob.id, alice.id, prismaTest)).toBe(false);
  });
});

describe("isBlocked", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("retourne true si A a bloqué B", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    await prismaTest.block.create({
      data: { blockerId: alice.id, blockedId: bob.id },
    });

    expect(await isBlocked(alice.id, bob.id, prismaTest)).toBe(true);
  });

  it("retourne true si B a bloqué A (symétrique)", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    await prismaTest.block.create({
      data: { blockerId: bob.id, blockedId: alice.id },
    });

    expect(await isBlocked(alice.id, bob.id, prismaTest)).toBe(true);
  });

  it("retourne false si aucun block", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();

    expect(await isBlocked(alice.id, bob.id, prismaTest)).toBe(false);
  });
});

describe("canInteract", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("retourne true si aucun block dans aucun sens", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();

    expect(await canInteract(alice.id, bob.id, prismaTest)).toBe(true);
  });

  it("retourne false si A a bloqué B", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    await prismaTest.block.create({
      data: { blockerId: alice.id, blockedId: bob.id },
    });

    expect(await canInteract(alice.id, bob.id, prismaTest)).toBe(false);
  });

  it("retourne false si B a bloqué A", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    await prismaTest.block.create({
      data: { blockerId: bob.id, blockedId: alice.id },
    });

    expect(await canInteract(alice.id, bob.id, prismaTest)).toBe(false);
  });
});

describe("getFollowersCount", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("retourne 0 pour un user sans followers", async () => {
    const alice = await createTestUser();
    expect(await getFollowersCount(alice.id, prismaTest)).toBe(0);
  });

  it("retourne le bon nombre de followers", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const charlie = await createTestUser();
    await prismaTest.follow.create({
      data: { followerId: bob.id, followingId: alice.id },
    });
    await prismaTest.follow.create({
      data: { followerId: charlie.id, followingId: alice.id },
    });

    expect(await getFollowersCount(alice.id, prismaTest)).toBe(2);
  });
});

describe("getFollowingIds", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("retourne la liste des userIds suivis", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const charlie = await createTestUser();
    await prismaTest.follow.create({
      data: { followerId: alice.id, followingId: bob.id },
    });
    await prismaTest.follow.create({
      data: { followerId: alice.id, followingId: charlie.id },
    });

    const ids = await getFollowingIds(alice.id, prismaTest);
    expect(ids).toHaveLength(2);
    expect(ids).toEqual(expect.arrayContaining([bob.id, charlie.id]));
  });

  it("retourne un tableau vide si l'user ne suit personne", async () => {
    const alice = await createTestUser();
    expect(await getFollowingIds(alice.id, prismaTest)).toEqual([]);
  });
});

describe("getBlockedIdsBothWays", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("retourne les ids bloqués et les ids qui ont bloqué", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const charlie = await createTestUser();
    // Alice a bloqué Bob
    await prismaTest.block.create({
      data: { blockerId: alice.id, blockedId: bob.id },
    });
    // Charlie a bloqué Alice
    await prismaTest.block.create({
      data: { blockerId: charlie.id, blockedId: alice.id },
    });

    const ids = await getBlockedIdsBothWays(alice.id, prismaTest);
    expect(ids).toHaveLength(2);
    expect(ids).toEqual(expect.arrayContaining([bob.id, charlie.id]));
  });

  it("retourne un tableau vide si aucun block", async () => {
    const alice = await createTestUser();
    expect(await getBlockedIdsBothWays(alice.id, prismaTest)).toEqual([]);
  });
});
