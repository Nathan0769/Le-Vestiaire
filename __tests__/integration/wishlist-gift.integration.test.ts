import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { User } from "@prisma/client";
import { prismaTest } from "@/__tests__/helpers/db";
import { createTestUser, createTestLeague, createTestClub, createTestJersey } from "@/__tests__/helpers/fixtures";
import { GET as getWishlist } from "@/app/api/wishlist/route";
import { PATCH as patchWishlistItem } from "@/app/api/wishlist/[id]/route";
import { getCurrentUser } from "@/lib/get-current-user";
import "@/__tests__/setup.integration";

vi.mock("@/lib/get-current-user", () => ({ getCurrentUser: vi.fn() }));

vi.mock("@/lib/rate-limit", () => ({
  standardRateLimit: {},
  getRateLimitIdentifier: vi.fn().mockResolvedValue("test-identifier"),
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 100, remaining: 99, reset: 0 }),
}));

const asUser = (user: User) => vi.mocked(getCurrentUser).mockResolvedValue(user as never);

function patch(id: string, body: unknown) {
  return patchWishlistItem(
    new Request(`http://localhost/api/wishlist/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    { params: Promise.resolve({ id }) }
  );
}

describe("infos cadeau d'une envie", () => {
  let owner: User;
  let other: User;
  let wishlistId: string;

  beforeEach(async () => {
    owner = await createTestUser();
    other = await createTestUser();
    const league = await createTestLeague();
    const club = await createTestClub(league.id);
    const jersey = await createTestJersey(club.id);
    const item = await prismaTest.wishlist.create({ data: { userId: owner.id, jerseyId: jersey.id } });
    wishlistId = item.id;
  });

  afterEach(() => vi.clearAllMocks());

  it("enregistre taille, version, flocage et coup de cœur", async () => {
    asUser(owner);
    const res = await patch(wishlistId, { size: "M", version: "AUTHENTIC", flockName: "MBAPPE", flockNumber: 10, priority: 2 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ size: "M", version: "AUTHENTIC", flockName: "MBAPPE", flockNumber: 10, priority: 2 });
  });

  it("renvoie 404 sur l'envie d'un autre utilisateur, sans la modifier", async () => {
    asUser(other);
    const res = await patch(wishlistId, { size: "L" });
    expect(res.status).toBe(404);
    const row = await prismaTest.wishlist.findUniqueOrThrow({ where: { id: wishlistId } });
    expect(row.size).toBeNull();
  });

  it("renvoie le code SIZE_INVALID sur une taille inconnue", async () => {
    asUser(owner);
    const res = await patch(wishlistId, { size: "XXXXL" });
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("SIZE_INVALID");
  });

  it("ne renvoie jamais la réservation au propriétaire", async () => {
    const share = await prismaTest.wishlistShare.create({
      data: { id: "share-test-01", userId: owner.id, theme: "christmas", title: "Noël" },
    });
    await prismaTest.giftReservation.create({
      data: { wishlistId, shareId: share.id, name: "Marie", tokenHash: "x" },
    });

    asUser(owner);
    const res = await getWishlist();
    const text = await res.text();
    expect(text).not.toContain("Marie");
    expect(text).not.toContain("reservation");
    expect(text).not.toContain("promoNotifiedPrice");
  });
});
