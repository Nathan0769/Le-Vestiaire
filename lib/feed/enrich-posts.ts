import type { Post } from "@prisma/client";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  getR2PresignedUrl,
  AVATARS_BUCKET,
  USER_JERSEY_PHOTOS_BUCKET,
} from "@/lib/r2-storage";
import { getFollowingIds } from "@/lib/follow";
import type { FeedPostItem, FeedLikerPreview } from "@/types/feed";

const MAX_LIKERS_PREVIEW = 3;

/**
 * Enrichit une liste de posts pour affichage : auteur, jersey/achievement/cap,
 * hasLiked, aperçu des 3 derniers likers, condition/size/purchasePrice, rating
 * donnée par l'auteur au maillot, position du maillot dans la collection du club.
 */
export async function enrichPostsForFeed(
  posts: Post[],
  currentUserId: string
): Promise<FeedPostItem[]> {
  if (posts.length === 0) return [];

  const authorIds = Array.from(new Set(posts.map((p) => p.authorId)));
  const jerseyRefIds = posts
    .filter((p) => p.type === "JERSEY_ADD")
    .map((p) => p.referenceId)
    .filter((v): v is string => Boolean(v));
  const achievementRefIds = posts
    .filter((p) => p.type === "ACHIEVEMENT_UNLOCK")
    .map((p) => p.referenceId)
    .filter((v): v is string => Boolean(v));
  const capAuthorIds = posts
    .filter((p) => p.type === "CAP_REACHED")
    .map((p) => p.authorId);

  const followingIdsSet = new Set(await getFollowingIds(currentUserId));

  const [authors, userJerseys, achievements, myLikes, latestLikes] =
    await Promise.all([
      prisma.user.findMany({
        where: { id: { in: authorIds } },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          image: true,
          favoriteClub: {
            select: { id: true, name: true, primaryColor: true },
          },
        },
      }),
      jerseyRefIds.length > 0
        ? prisma.userJersey.findMany({
            where: { id: { in: jerseyRefIds } },
            include: {
              jersey: {
                select: {
                  id: true,
                  name: true,
                  season: true,
                  type: true,
                  imageUrl: true,
                  slug: true,
                  mainColor: true,
                  clubId: true,
                  club: {
                    select: {
                      id: true,
                      name: true,
                      shortName: true,
                      logoUrl: true,
                      primaryColor: true,
                    },
                  },
                },
              },
              _count: { select: { patches: true } },
            },
          })
        : Promise.resolve([]),
      achievementRefIds.length > 0
        ? prisma.achievement.findMany({
            where: { id: { in: achievementRefIds } },
            select: {
              id: true,
              key: true,
              tier: true,
              category: true,
              unlockedAt: true,
              metadata: true,
            },
          })
        : Promise.resolve([]),
      prisma.postLike.findMany({
        where: {
          userId: currentUserId,
          postId: { in: posts.map((p) => p.id) },
        },
        select: { postId: true },
      }),
      // 3 derniers likers par post (via raw SQL pour éviter N queries)
      // Prisma.join + Prisma.sql : paramétrage sûr, pas d'interpolation string directe.
      prisma.$queryRaw<
        { post_id: string; user_id: string; username: string; avatar: string | null; created_at: Date }[]
      >(Prisma.sql`
        SELECT pl.post_id, pl.user_id, u.username, u.avatar, pl.created_at
        FROM (
          SELECT post_id, user_id, created_at,
            ROW_NUMBER() OVER (PARTITION BY post_id ORDER BY created_at DESC) AS rn
          FROM post_likes
          WHERE post_id IN (${Prisma.join(posts.map((p) => p.id))})
        ) pl
        JOIN "user" u ON u.id = pl.user_id
        WHERE pl.rn <= ${MAX_LIKERS_PREVIEW}
      `),
    ]);

  // Position du maillot dans la collection de son propriétaire (pour "Xe du RC Lens")
  const clubRanksByUserJersey = new Map<string, number>();
  for (const uj of userJerseys) {
    const rank = await prisma.userJersey.count({
      where: {
        userId: uj.userId,
        jersey: { clubId: uj.jersey.clubId },
        createdAt: { lte: uj.createdAt },
      },
    });
    clubRanksByUserJersey.set(uj.id, rank);
  }

  // Ratings donnés par l'auteur pour son propre maillot
  const ratingsMap = new Map<string, number>();
  if (userJerseys.length > 0) {
    const ratings = await prisma.rating.findMany({
      where: {
        OR: userJerseys.map((uj) => ({
          userId: uj.userId,
          jerseyId: uj.jersey.id,
        })),
      },
      select: { userId: true, jerseyId: true, rating: true },
    });
    for (const r of ratings) {
      ratingsMap.set(`${r.userId}:${r.jerseyId}`, Number(r.rating));
    }
  }

  // Mosaïques caps
  const capMosaics = new Map<string, { imageUrl: string | null }[]>();
  for (const authorId of new Set(capAuthorIds)) {
    const latest = await prisma.userJersey.findMany({
      where: { userId: authorId },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        jersey: { select: { imageUrl: true } },
      },
    });
    capMosaics.set(
      authorId,
      latest.map((uj) => ({ imageUrl: uj.jersey.imageUrl ?? null }))
    );
  }

  const authorMap = new Map(authors.map((a) => [a.id, a]));
  const jerseyMap = new Map(userJerseys.map((uj) => [uj.id, uj]));
  const achievementMap = new Map(achievements.map((a) => [a.id, a]));
  const likedSet = new Set(myLikes.map((l) => l.postId));

  // Group likers par post
  const likersByPost = new Map<string, FeedLikerPreview[]>();
  for (const l of latestLikes) {
    const list = likersByPost.get(l.post_id) ?? [];
    let avatarUrl: string | null = null;
    if (l.avatar) {
      avatarUrl = await getR2PresignedUrl(AVATARS_BUCKET, l.avatar, 60 * 60);
    }
    list.push({
      userId: l.user_id,
      name: l.username,
      avatarUrl,
    });
    likersByPost.set(l.post_id, list);
  }

  return Promise.all(
    posts.map(async (post): Promise<FeedPostItem> => {
      const author = authorMap.get(post.authorId);
      let avatarUrl: string | null = null;
      if (author?.avatar) {
        avatarUrl = await getR2PresignedUrl(
          AVATARS_BUCKET,
          author.avatar,
          60 * 60
        );
      }

      let payload: FeedPostItem["payload"] = null;

      if (post.type === "JERSEY_ADD" && post.referenceId) {
        const uj = jerseyMap.get(post.referenceId);
        if (uj) {
          const customPhotoUrl = uj.userPhotoUrl
            ? await getR2PresignedUrl(
                USER_JERSEY_PHOTOS_BUCKET,
                uj.userPhotoUrl,
                60 * 60
              )
            : null;
          payload = {
            userJerseyId: uj.id,
            jersey: {
              id: uj.jersey.id,
              name: uj.jersey.name,
              season: uj.jersey.season,
              type: uj.jersey.type,
              imageUrl: uj.jersey.imageUrl,
              slug: uj.jersey.slug,
              mainColor: uj.jersey.mainColor,
              club: uj.jersey.club,
            },
            customPhotoUrl,
            condition: uj.condition,
            size: uj.size ?? null,
            version: uj.version,
            playerName: uj.playerName ?? null,
            playerNumber: uj.playerNumber ?? null,
            purchasePrice: uj.purchasePrice ? Number(uj.purchasePrice) : null,
            authorRating: ratingsMap.get(`${uj.userId}:${uj.jersey.id}`) ?? null,
            clubRank: clubRanksByUserJersey.get(uj.id) ?? null,
            patchesCount: uj._count.patches,
          };
        }
      }

      if (post.type === "ACHIEVEMENT_UNLOCK" && post.referenceId) {
        const ach = achievementMap.get(post.referenceId);
        if (ach) {
          payload = {
            key: ach.key,
            tier: ach.tier,
            category: ach.category,
            unlockedAt: ach.unlockedAt.toISOString(),
            metadata: (ach.metadata as Record<string, unknown> | null) ?? null,
          };
        }
      }

      if (post.type === "CAP_REACHED" && post.capKind) {
        payload = {
          capKind: post.capKind,
          mosaic: capMosaics.get(post.authorId) ?? [],
        };
      }

      return {
        id: post.id,
        type: post.type,
        createdAt: post.createdAt.toISOString(),
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        hasLiked: likedSet.has(post.id),
        isFollowingAuthor: followingIdsSet.has(post.authorId),
        likersPreview: likersByPost.get(post.id) ?? [],
        author: author
          ? {
              id: author.id,
              username: author.username,
              name: author.username,
              avatarUrl: avatarUrl ?? author.image,
              favoriteClubColor: author.favoriteClub?.primaryColor ?? null,
              favoriteClubName: author.favoriteClub?.name ?? null,
            }
          : null,
        payload,
      };
    })
  );
}
