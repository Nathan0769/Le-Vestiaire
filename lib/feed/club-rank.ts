import type { PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";

type Db = Pick<PrismaClient, "userJersey">;

export interface ClubRankTarget {
  /** id du UserJersey ciblé */
  id: string;
  userId: string;
  clubId: string;
  createdAt: Date;
}

/**
 * Rang d'un maillot dans la collection de son propriétaire pour un club donné :
 * nombre de maillots du même user et du même club ajoutés avant ou en même temps
 * (createdAt <=). Sert au libellé "Xe du RC Lens" dans le feed.
 *
 * Batch : une seule requête pour toutes les cibles, contre un count() par cible
 * auparavant (N+1). Ne charge que les paires (userId, clubId) réellement utilisées.
 */
export async function computeClubRanks(
  targets: ClubRankTarget[],
  db: Db = prisma
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (targets.length === 0) return result;

  const pairKey = (userId: string, clubId: string) => `${userId}:${clubId}`;

  const pairs = new Map<string, { userId: string; clubId: string }>();
  for (const t of targets) {
    pairs.set(pairKey(t.userId, t.clubId), {
      userId: t.userId,
      clubId: t.clubId,
    });
  }

  const rows = await db.userJersey.findMany({
    where: {
      OR: Array.from(pairs.values()).map((p) => ({
        userId: p.userId,
        jersey: { clubId: p.clubId },
      })),
    },
    select: {
      userId: true,
      createdAt: true,
      jersey: { select: { clubId: true } },
    },
  });

  // Regroupe les dates d'ajout par paire (userId, clubId)
  const datesByPair = new Map<string, number[]>();
  for (const r of rows) {
    const k = pairKey(r.userId, r.jersey.clubId);
    const list = datesByPair.get(k) ?? [];
    list.push(r.createdAt.getTime());
    datesByPair.set(k, list);
  }

  for (const t of targets) {
    const dates = datesByPair.get(pairKey(t.userId, t.clubId)) ?? [];
    const threshold = t.createdAt.getTime();
    result.set(t.id, dates.filter((d) => d <= threshold).length);
  }

  return result;
}
