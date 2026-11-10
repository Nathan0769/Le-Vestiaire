import prisma from "@/lib/prisma";
import type { CfsProductState } from "@/lib/cfs-products";

/**
 * Mise à jour groupée des produits CFS : une requête par paquet au lieu d'une
 * par produit. Le prix en euros de l'API CFS suit le taux de change, donc
 * ~150 000 produits changent chaque nuit ; écrits un par un, le cron dépassait
 * ses 300 s et n'écrivait jamais les offres affichées (constaté le 2026-11-10,
 * aucune `cfs_availability` écrite depuis le 2026-11-06).
 */
const BULK_BATCH = 5_000;

export async function bulkUpdateCfsProducts(rows: { id: string; state: CfsProductState }[], now: Date): Promise<void> {
  for (let i = 0; i < rows.length; i += BULK_BATCH) {
    const batch = rows.slice(i, i + BULK_BATCH);
    const col = <T>(pick: (s: CfsProductState) => T) => batch.map((r) => pick(r.state));
    // Tout passe en texte : un tableau rempli de null serait typé integer[] par Prisma.
    const txt = (pick: (s: CfsProductState) => number | Date | null) =>
      col((s) => {
        const v = pick(s);
        return v === null ? null : v instanceof Date ? v.toISOString() : String(v);
      });
    await prisma.$executeRaw`
      UPDATE cfs_products AS p SET
        name = v.name,
        price = v.price::numeric,
        "promoPrice" = v."promoPrice"::numeric,
        "inStock" = v."inStock",
        "isReference" = v."isReference",
        condition = v.condition::"Condition",
        "productUrl" = v."productUrl",
        "imageUrl" = v."imageUrl",
        "soldAt" = v."soldAt"::timestamp(3),
        "soldPrice" = v."soldPrice"::numeric,
        "lastSeenAt" = ${now},
        "updatedAt" = ${now}
      FROM unnest(
        ${batch.map((r) => r.id)}::text[],
        ${col((s) => s.name)}::text[],
        ${txt((s) => s.price)}::text[],
        ${txt((s) => s.promoPrice)}::text[],
        ${col((s) => s.inStock)}::boolean[],
        ${col((s) => s.isReference)}::boolean[],
        ${col((s) => s.condition)}::text[],
        ${col((s) => s.productUrl)}::text[],
        ${col((s) => s.imageUrl)}::text[],
        ${txt((s) => s.soldAt)}::text[],
        ${txt((s) => s.soldPrice)}::text[]
      ) AS v(id, name, price, "promoPrice", "inStock", "isReference", condition, "productUrl", "imageUrl", "soldAt", "soldPrice")
      WHERE p.id = v.id`;
  }
}
