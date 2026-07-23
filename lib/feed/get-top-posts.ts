import type { Post, PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getBlockedIdsBothWays } from "@/lib/follow";

type Db = Pick<PrismaClient, "post" | "block" | "follow">;

/**
 * Retourne les posts globalement les plus likés sur les {days} derniers jours.
 * Exclut les posts d'users bloqués (dans les deux sens) et les profils privés.
 * Utilisé pour le highlight "posts populaires" de la homepage.
 */
export async function getTopPosts(
  currentUserId: string | null,
  { days = 14, limit = 3 }: { days?: number; limit?: number } = {},
  db: Db = prisma
): Promise<Post[]> {
  const blockedIds = currentUserId
    ? await getBlockedIdsBothWays(currentUserId, db)
    : [];

  const since = new Date();
  since.setDate(since.getDate() - days);

  return db.post.findMany({
    where: {
      deletedAt: null,
      createdAt: { gte: since },
      author: { isPrivate: false },
      ...(blockedIds.length > 0
        ? { authorId: { notIn: blockedIds } }
        : {}),
    },
    orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}
