import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { hashReservationToken, newReservationToken, normalizeGiftName, tokenMatches } from "@/lib/gift-reservation-token";

/**
 * Réservations « je l'offre » d'un partage. Une seule par envie (index unique),
 * créée sans compte. Le propriétaire n'y a jamais accès.
 */

export type ReserveResult =
  | { ok: true; token: string }
  | { ok: false; reason: "SHARE_NOT_FOUND" | "ALREADY_RESERVED" | "INVALID_NAME" };

/** L'envie appartient-elle au partage (lien actif, maillot partagé) ? */
async function findSharedWishlist(shareId: string, wishlistId: string) {
  const share = await prisma.wishlistShare.findFirst({
    where: { id: shareId, revokedAt: null },
    select: { userId: true, jerseyIds: true },
  });
  if (!share) return null;
  const item = await prisma.wishlist.findFirst({
    where: { id: wishlistId, userId: share.userId },
    select: { id: true, jerseyId: true },
  });
  if (!item) return null;
  if (share.jerseyIds.length > 0 && !share.jerseyIds.includes(item.jerseyId)) return null;
  return item;
}

export async function reserveGift(shareId: string, wishlistId: string, rawName: unknown): Promise<ReserveResult> {
  const name = normalizeGiftName(rawName);
  if (!name) return { ok: false, reason: "INVALID_NAME" };

  const item = await findSharedWishlist(shareId, wishlistId);
  if (!item) return { ok: false, reason: "SHARE_NOT_FOUND" };

  const token = newReservationToken();
  try {
    await prisma.giftReservation.create({
      data: { wishlistId: item.id, shareId, name, tokenHash: hashReservationToken(token) },
    });
  } catch (err) {
    // Deux proches en même temps : l'index unique tranche.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, reason: "ALREADY_RESERVED" };
    }
    throw err;
  }
  return { ok: true, token };
}

/** Annule une réservation avec le jeton du navigateur qui l'a créée. */
export async function cancelGift(shareId: string, wishlistId: string, token: string | null): Promise<boolean> {
  const reservation = await prisma.giftReservation.findFirst({
    where: { wishlistId, shareId },
    select: { id: true, tokenHash: true },
  });
  if (!reservation || !tokenMatches(token, reservation.tokenHash)) return false;
  await prisma.giftReservation.delete({ where: { id: reservation.id } });
  return true;
}
