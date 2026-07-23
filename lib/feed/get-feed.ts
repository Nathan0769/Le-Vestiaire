import type { PrismaClient, Post } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getFollowingIds, getBlockedIdsBothWays } from "@/lib/follow";

type Db = Pick<PrismaClient, "post" | "follow" | "block">;

export type FeedScope = "friends" | "global";

interface GetFeedParams {
  cursor?: string;
  limit?: number;
  scope?: FeedScope;
}

interface GetFeedResult {
  items: Post[];
  nextCursor: string | null;
}

/**
 * Score de boost : items récents avec engagement fort remontent.
 * Cap à 1 jour (86400 secondes) pour éviter qu'un ancien post trop liké reste éternellement en haut.
 */
export function computeBoost(likes: number, comments: number): number {
  return Math.min(likes * 3600 + comments * 7200, 86400);
}

/**
 * Retourne la timeline d'un user : posts des users suivis, ordre chronologique décroissant
 * avec boost simple sur l'engagement 24h. Cursor-based pagination.
 */
export async function getFeedForUser(
  userId: string,
  params: GetFeedParams = {},
  db: Db = prisma
): Promise<GetFeedResult> {
  const limit = params.limit ?? 20;
  const scope: FeedScope = params.scope ?? "friends";

  const blockedIds = await getBlockedIdsBothWays(userId, db);

  let whereAuthor: { in?: string[]; notIn?: string[] };

  if (scope === "friends") {
    const followingIds = await getFollowingIds(userId, db);
    if (followingIds.length === 0) {
      return { items: [], nextCursor: null };
    }
    const allowedAuthorIds = followingIds.filter(
      (id) => !blockedIds.includes(id)
    );
    if (allowedAuthorIds.length === 0) {
      return { items: [], nextCursor: null };
    }
    whereAuthor = { in: allowedAuthorIds };
  } else {
    // scope === "global" : tous sauf blockés + soi-même exclu pour éviter l'auto-spam en haut
    whereAuthor = {
      notIn: [...blockedIds, userId],
    };
  }

  const rows = await db.post.findMany({
    where: {
      authorId: whereAuthor,
      deletedAt: null,
      ...(scope === "global"
        ? {
            author: { isPrivate: false },
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { items, nextCursor };
}
