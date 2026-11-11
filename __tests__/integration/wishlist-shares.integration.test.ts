import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "@prisma/client";
import { prismaTest } from "@/__tests__/helpers/db";
import { createTestUser, createTestLeague, createTestClub, createTestJersey } from "@/__tests__/helpers/fixtures";
import { createShare, getPublicShare, getShareMeta, revokeShare } from "@/lib/wishlist-shares";
import { cancelGift, reserveGift } from "@/lib/gift-reservations";
import "@/__tests__/setup.integration";

vi.mock("@/lib/r2-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/r2-storage")>();
  return { ...actual, getR2PresignedUrl: vi.fn().mockResolvedValue("https://test.r2.dev/avatar.jpg") };
});

describe("partage vivant et je l'offre", () => {
  let owner: User;
  let favoriteId: string;
  let otherId: string;
  let otherJerseyId: string;

  beforeEach(async () => {
    owner = await createTestUser();
    const league = await createTestLeague();
    const club = await createTestClub(league.id);
    const a = await createTestJersey(club.id);
    const b = await createTestJersey(club.id, { type: "AWAY" });
    otherJerseyId = b.id;
    favoriteId = (await prismaTest.wishlist.create({ data: { userId: owner.id, jerseyId: a.id, priority: 2, size: "M" } })).id;
    otherId = (await prismaTest.wishlist.create({ data: { userId: owner.id, jerseyId: b.id } })).id;
  });

  const newShare = (jerseyIds: string[] = []) =>
    createShare(owner.id, { theme: "christmas", title: "Ma liste de Noël", jerseyIds });

  it("crée un lien de 12 caractères qui montre toute la liste, coups de cœur en tête", async () => {
    const share = await newShare();
    expect(share.id).toHaveLength(12);
    const page = await getPublicShare(share.id, null);
    expect(page?.items.map((i) => i.wishlistId)).toEqual([favoriteId, otherId]);
    expect(page?.items[0]).toMatchObject({ favorite: true, size: "M" });
  });

  it("ne montre que les maillots choisis", async () => {
    const share = await newShare([otherJerseyId]);
    const page = await getPublicShare(share.id, null);
    expect(page?.items.map((i) => i.wishlistId)).toEqual([otherId]);
  });

  it("suit la wishlist en direct : une envie supprimée disparaît", async () => {
    const share = await newShare();
    await prismaTest.wishlist.delete({ where: { id: otherId } });
    const page = await getPublicShare(share.id, null);
    expect(page?.items.map((i) => i.wishlistId)).toEqual([favoriteId]);
  });

  it("renvoie null pour un lien révoqué", async () => {
    const share = await newShare();
    expect(await revokeShare(owner.id, share.id)).toBe(true);
    expect(await getPublicShare(share.id, null)).toBeNull();
  });

  it("réserve une envie et l'affiche aux visiteurs", async () => {
    const share = await newShare();
    const result = await reserveGift(share.id, favoriteId, "Marie");
    expect(result.ok).toBe(true);
    const page = await getPublicShare(share.id, null);
    expect(page?.items[0].reservedBy).toBe("Marie");
  });

  it("cache la réservation au propriétaire qui ouvre son lien", async () => {
    const share = await newShare();
    await reserveGift(share.id, favoriteId, "Marie");
    const page = await getPublicShare(share.id, owner.id);
    expect(page?.viewerIsOwner).toBe(true);
    expect(page?.items[0].reservedBy).toBeNull();
  });

  it("refuse une deuxième réservation avec ALREADY_RESERVED", async () => {
    const share = await newShare();
    await reserveGift(share.id, favoriteId, "Marie");
    expect(await reserveGift(share.id, favoriteId, "Paul")).toEqual({ ok: false, reason: "ALREADY_RESERVED" });
  });

  it("refuse une envie hors du partage avec SHARE_NOT_FOUND", async () => {
    const share = await newShare([otherJerseyId]);
    expect(await reserveGift(share.id, favoriteId, "Marie")).toEqual({ ok: false, reason: "SHARE_NOT_FOUND" });
  });

  it("annule seulement avec le bon jeton", async () => {
    const share = await newShare();
    const result = await reserveGift(share.id, favoriteId, "Marie");
    if (!result.ok) throw new Error("réservation attendue");
    expect(await cancelGift(share.id, favoriteId, "mauvais-jeton")).toBe(false);
    expect(await cancelGift(share.id, favoriteId, result.token)).toBe(true);
    expect(await prismaTest.giftReservation.count({ where: { wishlistId: favoriteId } })).toBe(0);
  });

  it("supprime la réservation quand l'envie est retirée", async () => {
    const share = await newShare();
    await reserveGift(share.id, favoriteId, "Marie");
    await prismaTest.wishlist.delete({ where: { id: favoriteId } });
    expect(await prismaTest.giftReservation.count()).toBe(0);
  });

  it("aperçu du lien : thème, auteur, nombre de maillots et photos, sans réservation", async () => {
    const share = await newShare([otherJerseyId]);
    const meta = await getShareMeta(share.id);
    expect(meta).toEqual({
      theme: "christmas",
      title: "Ma liste de Noël",
      ownerName: expect.any(String),
      count: 1,
      imageUrls: [expect.any(String)],
    });
  });

  it("aperçu d'un lien révoqué : rien", async () => {
    const share = await newShare();
    await revokeShare(owner.id, share.id);
    expect(await getShareMeta(share.id)).toBeNull();
  });
});
