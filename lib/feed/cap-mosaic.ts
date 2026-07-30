import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

type Db = Pick<PrismaClient, "$queryRaw">;

export interface CapMosaicItem {
  imageUrl: string | null;
}

/**
 * Pour chaque auteur, les {limit} derniers maillots ajoutés (du plus récent au
 * plus ancien), utilisés comme mosaïque des posts CAP_REACHED.
 *
 * Batch : une seule requête pour tous les auteurs via ROW_NUMBER() (même pattern
 * que l'aperçu des likers), au lieu d'un findMany par auteur (N+1).
 */
export async function computeCapMosaics(
  authorIds: string[],
  limit = 4,
  db: Db = prisma
): Promise<Map<string, CapMosaicItem[]>> {
  const result = new Map<string, CapMosaicItem[]>();
  if (authorIds.length === 0) return result;

  // Prisma.join : paramétrage sûr, pas d'interpolation string directe.
  const rows = await db.$queryRaw<
    { user_id: string; image_url: string | null }[]
  >(Prisma.sql`
    SELECT t.user_id, t.image_url
    FROM (
      SELECT
        uj."userId" AS user_id,
        j."imageUrl" AS image_url,
        ROW_NUMBER() OVER (
          PARTITION BY uj."userId"
          ORDER BY uj."createdAt" DESC, uj.id DESC
        ) AS rn
      FROM user_jerseys uj
      JOIN jerseys j ON j.id = uj."jerseyId"
      WHERE uj."userId" IN (${Prisma.join(authorIds)})
    ) t
    WHERE t.rn <= ${limit}
    ORDER BY t.user_id, t.rn
  `);

  for (const r of rows) {
    const list = result.get(r.user_id) ?? [];
    list.push({ imageUrl: r.image_url });
    result.set(r.user_id, list);
  }

  return result;
}
