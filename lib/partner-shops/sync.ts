import type { PartnerMatchStatus, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { fetchShopProducts } from "./fetchers";
import { availabilityTransitions, CANCEL_WINDOW_MS } from "./inferred-sales";
import { loadClubIndex, resolvePartnerMatch } from "./matcher";
import { offerChanged, type OfferState } from "./offer-changes";
import { isAllowedImageUrl, isAllowedShopUrl, PARTNER_SHOPS } from "./shops";
import { isStorableProduct, parsePartnerTitle } from "./title-parser";
import type { PartnerShop, ShopProduct } from "./types";

export interface SyncResult {
  shop: string;
  fetched: number;
  upserted: number;
  /** Produits hors maillots de foot (veste, polo, rugby...) : ni cote ni affichage, non stockés. */
  skipped: number;
  rejected: number;
  removed: number;
  sales: number;
  cancelled: number;
  /** Maillots dont l'offre visible a changé : fiches ISR à régénérer. */
  changedJerseyIds: string[];
}

// Statuts posés à la main (ou définitifs) : la synchro ne les recalcule pas.
const KEPT_STATUSES: PartnerMatchStatus[] = ["MANUAL", "IGNORED"];

/** Prix affiché : la taille dispo la moins chère, sinon la moins chère tout court. */
function headlineVariant(product: ShopProduct) {
  const pool = product.variants.some((v) => v.available)
    ? product.variants.filter((v) => v.available)
    : product.variants;
  return pool.reduce<(typeof pool)[number] | null>(
    (min, v) => (min === null || v.price < min.price ? v : min),
    null
  );
}

type StoredProduct = Prisma.PartnerProductGetPayload<{ include: { variants: true } }>;

function storedOffer(p: StoredProduct): OfferState | null {
  if (p.removedAt) return null;
  return {
    available: p.available,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice === null ? null : Number(p.compareAtPrice),
    jerseyId: p.jerseyId,
  };
}

type ProductFields = {
  title: string;
  url: string;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
  jerseyId: string | null;
  matchStatus: PartnerMatchStatus;
  removedAt: null;
};

function productDirty(p: StoredProduct, f: ProductFields): boolean {
  return (
    p.title !== f.title ||
    p.url !== f.url ||
    p.imageUrl !== f.imageUrl ||
    Number(p.price) !== f.price ||
    (p.compareAtPrice === null ? null : Number(p.compareAtPrice)) !== f.compareAtPrice ||
    p.available !== f.available ||
    p.jerseyId !== f.jerseyId ||
    p.matchStatus !== f.matchStatus ||
    p.removedAt !== null
  );
}

export async function syncPartnerShop(
  shop: PartnerShop,
  options: { fetchProducts?: (shop: PartnerShop) => Promise<ShopProduct[]>; now?: Date } = {}
): Promise<SyncResult> {
  const now = options.now ?? new Date();
  const feed = await (options.fetchProducts ?? fetchShopProducts)(shop);

  const result: SyncResult = {
    shop: shop.slug,
    fetched: feed.length,
    upserted: 0,
    skipped: 0,
    rejected: 0,
    removed: 0,
    sales: 0,
    cancelled: 0,
    changedJerseyIds: [],
  };
  const changed = new Set<string>();
  const markChanged = (before: OfferState | null, after: OfferState | null) => {
    if (!offerChanged(before, after)) return;
    if (before?.jerseyId) changed.add(before.jerseyId);
    if (after?.jerseyId) changed.add(after.jerseyId);
  };

  const [stored, clubIndex] = await Promise.all([
    prisma.partnerProduct.findMany({ where: { shop: shop.slug }, include: { variants: true } }),
    loadClubIndex(shop.slug),
  ]);
  const storedById = new Map(stored.map((p) => [p.externalId, p]));
  const seen = new Set<string>();

  for (const item of feed) {
    if (!isStorableProduct(item.productType, item.vendor)) {
      result.skipped++;
      continue;
    }
    if (!isAllowedShopUrl(shop, item.url) || item.variants.length === 0) {
      result.rejected++;
      continue;
    }
    seen.add(item.externalId);
    const existing = storedById.get(item.externalId);

    let match: { jerseyId: string | null; matchStatus: PartnerMatchStatus };
    if (existing && (KEPT_STATUSES.includes(existing.matchStatus) || (existing.matchStatus === "MATCHED" && existing.jerseyId))) {
      match = { jerseyId: existing.jerseyId, matchStatus: existing.matchStatus };
    } else {
      match = await resolvePartnerMatch(parsePartnerTitle(item.title, item.productType), clubIndex);
    }

    const headline = headlineVariant(item)!;
    const fields: ProductFields = {
      title: item.title,
      url: item.url,
      imageUrl: item.imageUrl && isAllowedImageUrl(shop, item.imageUrl) ? item.imageUrl : null,
      price: headline.price,
      compareAtPrice: headline.compareAtPrice,
      available: item.variants.some((v) => v.available),
      jerseyId: match.jerseyId,
      matchStatus: match.matchStatus,
      removedAt: null,
    };
    markChanged(existing ? storedOffer(existing) : null, { ...fields, jerseyId: match.jerseyId });

    if (!existing) {
      await prisma.partnerProduct.create({
        data: {
          shop: shop.slug,
          externalId: item.externalId,
          firstSeenAt: now,
          lastSeenAt: now,
          ...fields,
          variants: {
            create: item.variants.map((v) => ({
              externalId: v.externalId,
              size: v.size,
              price: v.price,
              available: v.available,
              availabilityChangedAt: now,
            })),
          },
        },
      });
      result.upserted++;
      continue;
    }

    const transitions = availabilityTransitions({
      stored: existing.variants.map((v) => ({
        id: v.id,
        externalId: v.externalId,
        available: v.available,
        removedAt: v.removedAt,
        availabilityChangedAt: v.availabilityChangedAt,
        price: Number(v.price),
      })),
      feed: item.variants,
      productStillListed: true,
      now,
    });

    const storedVariantIds = new Set(existing.variants.map((v) => v.externalId));
    const ops: Prisma.PrismaPromise<unknown>[] = [
      ...(productDirty(existing, fields)
        ? [prisma.partnerProduct.update({ where: { id: existing.id }, data: fields })]
        : []),
      ...item.variants
        .filter((v) => !storedVariantIds.has(v.externalId))
        .map((v) =>
          prisma.partnerVariant.create({
            data: {
              productId: existing.id,
              externalId: v.externalId,
              size: v.size,
              price: v.price,
              available: v.available,
              availabilityChangedAt: now,
            },
          })
        ),
      ...transitions.changes.map((c) =>
        prisma.partnerVariant.update({
          where: { id: c.variantId },
          data: { available: c.available, removedAt: c.removedAt, availabilityChangedAt: c.availabilityChangedAt },
        })
      ),
      ...existing.variants
        .map((v) => ({ v, inFeed: item.variants.find((f) => f.externalId === v.externalId) }))
        .filter(({ v, inFeed }) => inFeed && inFeed.price !== Number(v.price))
        .map(({ v, inFeed }) =>
          prisma.partnerVariant.update({ where: { id: v.id }, data: { price: inFeed!.price, size: inFeed!.size } })
        ),
    ];
    if (transitions.sales.length > 0) {
      ops.push(
        prisma.partnerSale.createMany({
          data: transitions.sales.map((s) => ({
            shop: shop.slug,
            productId: existing.id,
            variantId: s.variantId,
            jerseyId: match.jerseyId,
            kind: s.kind,
            price: s.price,
            soldAt: now,
          })),
        })
      );
    }
    for (const variantId of transitions.cancelVariantIds) {
      ops.push(
        prisma.partnerSale.updateMany({
          where: {
            variantId,
            cancelledAt: null,
            soldAt: { gte: new Date(now.getTime() - CANCEL_WINDOW_MS) },
          },
          data: { cancelledAt: now },
        })
      );
    }

    if (ops.length > 0) await prisma.$transaction(ops);
    result.upserted++;
    result.sales += transitions.sales.length;
    result.cancelled += transitions.cancelVariantIds.length;
  }

  // Une seule écriture pour tous les produits vus : la plupart ne changent pas d'un jour à l'autre.
  await prisma.partnerProduct.updateMany({
    where: { shop: shop.slug, externalId: { in: [...seen] } },
    data: { lastSeenAt: now },
  });

  // Produit retiré en entier : dépublication possible, aucune vente déduite.
  const gone = stored.filter((p) => !seen.has(p.externalId) && p.removedAt === null);
  if (gone.length > 0) {
    await prisma.partnerProduct.updateMany({
      where: { id: { in: gone.map((p) => p.id) } },
      data: { removedAt: now },
    });
    for (const p of gone) markChanged(storedOffer(p), null);
    result.removed = gone.length;
  }

  result.changedJerseyIds = [...changed];
  return result;
}

/** Synchronise chaque boutique active ; l'échec d'une boutique n'arrête pas les autres. */
export async function syncAllPartnerShops(): Promise<(SyncResult | { shop: string; error: string })[]> {
  const results: (SyncResult | { shop: string; error: string })[] = [];
  for (const shop of PARTNER_SHOPS.filter((s) => s.active)) {
    try {
      results.push(await syncPartnerShop(shop));
    } catch (err) {
      console.error(`[partner-shops] synchro ${shop.slug} échouée:`, err);
      results.push({ shop: shop.slug, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return results;
}
