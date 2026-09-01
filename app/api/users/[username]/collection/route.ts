import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isBlocked } from "@/lib/follow";
import { getR2PresignedUrl, USER_JERSEY_PHOTOS_BUCKET } from "@/lib/r2-storage";

/**
 * Collection publique d'un utilisateur par username (app mobile).
 * Même forme de sortie que GET /api/collection. Auth requise, blocage -> 403.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const identifier = await getRateLimitIdentifier(currentUser.id);
    const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const { username: raw } = await params;
    const username = raw.toLowerCase();

    const target = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    if (target.id !== currentUser.id && (await isBlocked(currentUser.id, target.id))) {
      return NextResponse.json({ error: "Accès bloqué" }, { status: 403 });
    }

    const collectionItems = await prisma.userJersey.findMany({
      where: { userId: target.id },
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

    // Posts JERSEY_ADD du profil visité + likes de l'utilisateur courant.
    const itemIds = collectionItems.map((i) => i.id);
    const posts = itemIds.length
      ? await prisma.post.findMany({
          where: {
            authorId: target.id,
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
    console.error("Erreur GET /api/users/[username]/collection:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
