import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { User } from "@prisma/client";
import { prismaTest, cleanDatabase } from "@/__tests__/helpers/db";
import {
  createTestUser,
  createTestLeague,
  createTestClub,
  createTestJersey,
} from "@/__tests__/helpers/fixtures";
import { GET as getUserCollection } from "@/app/api/users/[username]/collection/route";
import { GET as getUserWishlist } from "@/app/api/users/[username]/wishlist/route";
import { GET as getLeaderboard } from "@/app/api/leaderboard/route";
import "@/__tests__/setup.integration";

/**
 * Compte privé : collection et wishlist réservées au propriétaire et à ses
 * abonnés, jamais nominatif ni cliquable dans le classement.
 */

vi.mock("@/lib/get-current-user", () => ({ getCurrentUser: vi.fn() }));

vi.mock("@/lib/rate-limit", () => ({
  standardRateLimit: {},
  generousRateLimit: {},
  getRateLimitIdentifier: vi.fn().mockResolvedValue("test-identifier"),
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 100, remaining: 99, reset: 0 }),
}));

vi.mock("@/lib/fx", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/fx")>();
  return { ...actual, getRatesToEur: vi.fn().mockResolvedValue(actual.FX_FALLBACK_RATES) };
});

async function signIn(user: User) {
  const { getCurrentUser } = await import("@/lib/get-current-user");
  vi.mocked(getCurrentUser).mockResolvedValue(user as never);
}

async function seedCollection(userId: string) {
  const league = await createTestLeague();
  const club = await createTestClub(league.id);
  const jersey = await createTestJersey(club.id);
  await prismaTest.userJersey.create({
    data: { userId, jerseyId: jersey.id, size: "M", condition: "MINT" },
  });
}

const params = (username: string) => ({ params: Promise.resolve({ username }) });

describe("compte privé", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("refuse la collection à un non-abonné avec PROFILE_PRIVATE", async () => {
    const owner = await createTestUser({ isPrivate: true });
    const viewer = await createTestUser();
    await signIn(viewer);

    const res = await getUserCollection(new Request("http://localhost"), params(owner.username));

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: "PROFILE_PRIVATE" });
  });

  it("refuse la wishlist à un non-abonné avec PROFILE_PRIVATE", async () => {
    const owner = await createTestUser({ isPrivate: true });
    const viewer = await createTestUser();
    await signIn(viewer);

    const res = await getUserWishlist(new Request("http://localhost"), params(owner.username));

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: "PROFILE_PRIVATE" });
  });

  it("sert la collection à un abonné", async () => {
    const owner = await createTestUser({ isPrivate: true });
    const viewer = await createTestUser();
    await prismaTest.follow.create({ data: { followerId: viewer.id, followingId: owner.id } });
    await signIn(viewer);

    const res = await getUserCollection(new Request("http://localhost"), params(owner.username));

    expect(res.status).toBe(200);
  });

  it("anonymise un compte privé dans le classement même s'il a choisi d'être visible", async () => {
    const owner = await createTestUser({ isPrivate: true, leaderboardAnonymous: false });
    await seedCollection(owner.id);
    const viewer = await createTestUser();
    await signIn(viewer);

    const res = await getLeaderboard(new NextRequest("http://localhost/api/leaderboard"));
    const { entries } = await res.json();
    const entry = entries.find((e: { userId: string }) => e.userId === owner.id);

    expect(entry).toMatchObject({ isAnonymous: true, isPrivate: true, avatar: null });
    expect(entry.username).not.toBe(owner.username);
  });
});
