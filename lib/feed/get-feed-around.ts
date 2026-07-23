import type { PrismaClient, Post } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getBlockedIdsBothWays, isBlocked } from "@/lib/follow";

type Db = Pick<PrismaClient, "post" | "block" | "user" | "follow">;

interface AroundParams {
  beforeLimit?: number;
  afterLimit?: number;
}

interface AroundResult {
  newer: Post[];
  target: Post | null;
  older: Post[];
  hasMoreNewer: boolean;
  hasMoreOlder: boolean;
}

/**
 * Retourne une fenêtre de posts centrée sur un post cible.
 * Utilisé quand l'user arrive sur /feed?post=X depuis une notif : on veut
 * afficher la card ciblée avec du contexte alentour (posts plus récents +
 * plus vieux), pas juste la card seule.
 *
 * Scope = "global" implicite : le post est visible peu importe si l'user
 * suit son auteur (fix du cas notif sur ses propres posts absents du "friends").
 *
 * Retourne target=null si le post est bloqué, supprimé ou d'un profil privé
 * dont l'user n'est pas follower.
 */
export async function getFeedAroundPost(
  userId: string,
  targetPostId: string,
  { beforeLimit = 10, afterLimit = 10 }: AroundParams = {},
  db: Db = prisma
): Promise<AroundResult> {
  const target = await db.post.findFirst({
    where: { id: targetPostId, deletedAt: null },
  });

  if (!target) {
    return {
      newer: [],
      target: null,
      older: [],
      hasMoreNewer: false,
      hasMoreOlder: false,
    };
  }

  // Gate block bidirectionnel
  if (userId !== target.authorId && (await isBlocked(userId, target.authorId, db))) {
    return {
      newer: [],
      target: null,
      older: [],
      hasMoreNewer: false,
      hasMoreOlder: false,
    };
  }

  // Gate privacy : profil privé accessible seulement à l'auteur ou ses followers
  if (userId !== target.authorId) {
    const author = await db.user.findUnique({
      where: { id: target.authorId },
      select: { isPrivate: true },
    });
    if (author?.isPrivate) {
      const follows = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: target.authorId,
          },
        },
        select: { id: true },
      });
      if (!follows) {
        return {
          newer: [],
          target: null,
          older: [],
          hasMoreNewer: false,
          hasMoreOlder: false,
        };
      }
    }
  }

  const blockedIds = await getBlockedIdsBothWays(userId, db);
  const authorFilter =
    blockedIds.length > 0 ? { authorId: { notIn: blockedIds } } : {};

  // Posts plus récents (> target.createdAt) : query DESC, on prendra les N plus proches
  const newerRows = await db.post.findMany({
    where: {
      ...authorFilter,
      deletedAt: null,
      author: { isPrivate: false },
      OR: [
        { createdAt: { gt: target.createdAt } },
        {
          createdAt: target.createdAt,
          id: { gt: target.id },
        },
      ],
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: beforeLimit + 1,
  });
  const hasMoreNewer = newerRows.length > beforeLimit;
  // Reverse pour ordre DESC (plus récents en haut)
  const newer = (hasMoreNewer ? newerRows.slice(0, beforeLimit) : newerRows).reverse();

  // Posts plus vieux (< target.createdAt) : query DESC
  const olderRows = await db.post.findMany({
    where: {
      ...authorFilter,
      deletedAt: null,
      author: { isPrivate: false },
      OR: [
        { createdAt: { lt: target.createdAt } },
        {
          createdAt: target.createdAt,
          id: { lt: target.id },
        },
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: afterLimit + 1,
  });
  const hasMoreOlder = olderRows.length > afterLimit;
  const older = hasMoreOlder ? olderRows.slice(0, afterLimit) : olderRows;

  return {
    newer,
    target,
    older,
    hasMoreNewer,
    hasMoreOlder,
  };
}
