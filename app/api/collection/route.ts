import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { getR2PresignedUrl, USER_JERSEY_PHOTOS_BUCKET } from "@/lib/r2-storage";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const collectionItems = await prisma.userJersey.findMany({
      where: { userId: currentUser.id },
      select: {
        id: true,
        jerseyId: true,
        version: true,
        size: true,
        condition: true,
        hasTags: true,
        playerName: true,
        playerNumber: true,
        purchasePrice: true,
        purchaseDate: true,
        notes: true,
        isGift: true,
        isFromMysteryBox: true,
        hasLongSleeves: true,
        userPhotoUrls: true,
        isSigned: true,
        signedBy: true,
        hasAuthCertificate: true,
        certificateUrl: true,
        matchDescription: true,
        matchDate: true,
        pinnedAt: true,
        createdAt: true,
        updatedAt: true,
        patches: {
          select: {
            id: true,
            patchId: true,
            customLabel: true,
            patch: {
              select: {
                id: true,
                name: true,
                family: true,
                versions: {
                  select: {
                    id: true,
                    seasonStart: true,
                    seasonEnd: true,
                    imageUrl: true,
                  },
                },
              },
            },
          },
        },
        jersey: {
          include: {
            club: {
              include: {
                league: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Posts JERSEY_ADD associés (likes affichés/cliquables côté app mobile).
    const itemIds = collectionItems.map((i) => i.id);
    const posts = itemIds.length
      ? await prisma.post.findMany({
          where: {
            authorId: currentUser.id,
            type: "JERSEY_ADD",
            referenceId: { in: itemIds },
            deletedAt: null,
          },
          select: { id: true, referenceId: true, likeCount: true },
        })
      : [];
    const postByRef = new Map(posts.map((p) => [p.referenceId, p]));
    const likedPostIds = posts.length
      ? new Set(
          (
            await prisma.postLike.findMany({
              where: {
                userId: currentUser.id,
                postId: { in: posts.map((p) => p.id) },
              },
              select: { postId: true },
            })
          ).map((l) => l.postId)
        )
      : new Set<string>();

    const formatted = await Promise.all(
      collectionItems.map(async (item) => {
        const userPhotoUrls = await Promise.all(
          item.userPhotoUrls.map((path) =>
            getR2PresignedUrl(USER_JERSEY_PHOTOS_BUCKET, path, 60 * 60)
          )
        );

        const post = postByRef.get(item.id);

        return {
          ...item,
          userPhotoUrl: userPhotoUrls[0] ?? null,
          userPhotoUrls,
          userPhotoPaths: item.userPhotoUrls,
          purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
          postId: post?.id ?? null,
          likeCount: post?.likeCount ?? 0,
          hasLiked: post ? likedPostIds.has(post.id) : false,
          jersey: {
            ...item.jersey,
            retailPrice: item.jersey.retailPrice
              ? Number(item.jersey.retailPrice)
              : null,
          },
        };
      })
    );

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Erreur GET /api/collection:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
