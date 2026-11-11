import { nanoid } from "nanoid";
import prisma from "@/lib/prisma";
import type { Theme } from "@/types/theme";
import { getPartnerOffers } from "@/lib/partner-shops/offers";
import { cfsOfferInput, wishlistOffers, type WishlistOffer } from "@/lib/wishlist-offers";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";

/**
 * Partage vivant d'une wishlist (`/w/{id}`) : le lien lit la wishlist en
 * direct, filtrée par les maillots choisis (aucun = toute la liste).
 * Spec : docs/specs/2026-11-09-wishlist-noel.md.
 */

export const SHARE_THEMES = ["christmas", "birthday", "valentine", "default"] as const satisfies readonly Theme[];
export const SHARE_ID_LENGTH = 12;
export const SHARE_TITLE_MAX = 200;
export const SHARE_MESSAGE_MAX = 500;
export const SHARE_JERSEYS_MAX = 100;

export interface CreateShareInput {
  theme: Theme;
  title: string;
  message?: string | null;
  jerseyIds: string[];
}

const SHARE_PUBLIC_SELECT = { id: true, theme: true, title: true, message: true, jerseyIds: true, createdAt: true } as const;

export async function createShare(userId: string, input: CreateShareInput) {
  return prisma.wishlistShare.create({
    data: {
      id: nanoid(SHARE_ID_LENGTH),
      userId,
      theme: input.theme,
      title: input.title.trim(),
      message: input.message?.trim() || null,
      jerseyIds: [...new Set(input.jerseyIds)],
    },
    select: SHARE_PUBLIC_SELECT,
  });
}

export async function listShares(userId: string) {
  return prisma.wishlistShare.findMany({
    where: { userId, revokedAt: null },
    select: SHARE_PUBLIC_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

/** Révoque un lien du propriétaire. Faux si le lien n'est pas à lui. */
export async function revokeShare(userId: string, shareId: string): Promise<boolean> {
  const { count } = await prisma.wishlistShare.updateMany({
    where: { id: shareId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return count > 0;
}

/** Photos montrées dans l'aperçu du lien (iMessage, WhatsApp). */
const SHARE_META_IMAGES = 4;
// Le générateur d'image (next/og) ne lit ni WebP ni AVIF : la photo resterait blanche.
const OG_READABLE_IMAGE = /\.(jpe?g|png)(\?|$)/i;

/**
 * Aperçu d'un partage pour son titre et son image de lien : lecture légère,
 * sans offres ni réservations. Null si le lien n'existe pas ou est révoqué.
 */
export async function getShareMeta(shareId: string): Promise<{
  theme: Theme;
  title: string;
  username: string | null;
  count: number;
  imageUrls: string[];
} | null> {
  const share = await prisma.wishlistShare.findFirst({
    where: { id: shareId, revokedAt: null },
    select: { theme: true, title: true, jerseyIds: true, userId: true, user: { select: { username: true } } },
  });
  if (!share) return null;
  const where = {
    userId: share.userId,
    ...(share.jerseyIds.length > 0 ? { jerseyId: { in: share.jerseyIds } } : {}),
  };
  const [count, items] = await Promise.all([
    prisma.wishlist.count({ where }),
    prisma.wishlist.findMany({
      where,
      select: { jersey: { select: { imageUrl: true } } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: SHARE_META_IMAGES * 3,
    }),
  ]);
  return {
    theme: share.theme as Theme,
    title: share.title,
    username: share.user.username,
    count,
    imageUrls: items
      .map((i) => i.jersey.imageUrl)
      .filter((url) => OG_READABLE_IMAGE.test(url))
      .slice(0, SHARE_META_IMAGES),
  };
}

export interface PublicShareItem {
  wishlistId: string;
  favorite: boolean;
  size: string | null;
  version: string | null;
  flockName: string | null;
  flockNumber: number | null;
  jersey: {
    id: string;
    name: string;
    imageUrl: string;
    type: string;
    variant: number;
    season: string;
    slug: string | null;
    club: { id: string; name: string; shortName: string; logoUrl: string; leagueId: string };
  };
  offers: WishlistOffer[];
  /** Prénom du proche qui l'offre ; toujours null pour le propriétaire (surprise). */
  reservedBy: string | null;
}

export interface PublicShare {
  id: string;
  theme: Theme;
  title: string;
  message: string | null;
  owner: { username: string | null; avatarUrl: string | null };
  /** Vrai quand le propriétaire regarde son propre lien : réservations masquées. */
  viewerIsOwner: boolean;
  items: PublicShareItem[];
}

/**
 * Page publique d'un partage, ou null s'il n'existe pas ou a été révoqué.
 * N'expose que ce que le propriétaire a choisi de partager.
 */
export async function getPublicShare(shareId: string, viewerId: string | null): Promise<PublicShare | null> {
  const share = await prisma.wishlistShare.findFirst({
    where: { id: shareId, revokedAt: null },
    select: {
      id: true,
      theme: true,
      title: true,
      message: true,
      jerseyIds: true,
      userId: true,
      user: { select: { username: true, avatar: true } },
    },
  });
  if (!share) return null;

  const viewerIsOwner = viewerId === share.userId;

  const items = await prisma.wishlist.findMany({
    where: {
      userId: share.userId,
      ...(share.jerseyIds.length > 0 ? { jerseyId: { in: share.jerseyIds } } : {}),
    },
    select: {
      id: true,
      jerseyId: true,
      priority: true,
      size: true,
      version: true,
      flockName: true,
      flockNumber: true,
      createdAt: true,
      reservation: { select: { name: true } },
      jersey: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          type: true,
          variant: true,
          season: true,
          slug: true,
          club: { select: { id: true, name: true, shortName: true, logoUrl: true, leagueId: true } },
          cfsAvailability: { select: { price: true, promoPrice: true, affiliateUrl: true, sizeOffers: true } },
        },
      },
    },
    // Coups de cœur d'abord, puis les plus récents.
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  const partnerOffers = await getPartnerOffers(items.map((i) => i.jerseyId));
  const avatarUrl = share.user.avatar ? await getR2PresignedUrl(AVATARS_BUCKET, share.user.avatar, 60 * 60) : null;

  return {
    id: share.id,
    theme: (SHARE_THEMES as readonly string[]).includes(share.theme) ? (share.theme as Theme) : "default",
    title: share.title,
    message: share.message,
    owner: { username: share.user.username, avatarUrl },
    viewerIsOwner,
    items: items.map((item) => {
      const { cfsAvailability: av, ...jersey } = item.jersey;
      return {
        wishlistId: item.id,
        favorite: item.priority >= 2,
        size: item.size,
        version: item.version,
        flockName: item.flockName,
        flockNumber: item.flockNumber,
        jersey: { ...jersey, variant: jersey.variant ?? 1 },
        offers: wishlistOffers({
          cfs: av ? cfsOfferInput(av, `share-${item.jerseyId}`) : null,
          partnerOffers: partnerOffers.get(item.jerseyId) ?? [],
          size: item.size,
        }),
        reservedBy: viewerIsOwner ? null : (item.reservation?.name ?? null),
      };
    }),
  };
}
