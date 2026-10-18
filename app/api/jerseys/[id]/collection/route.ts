import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  collectionItemFieldError,
  normalizePatchInputs,
  type PatchInput,
} from "@/lib/collection-item-rules";
import { getCurrentUser } from "@/lib/get-current-user";
import { getR2PresignedUrl, USER_JERSEY_PHOTOS_BUCKET } from "@/lib/r2-storage";
import {
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { checkAchievements } from "@/lib/achievements/check";
import { createFeedPost } from "@/lib/feed/create-post";
import { detectCollectionCap, detectValueCap } from "@/lib/feed/cap-detector";
import {
  normalizeUserPhotoPaths,
  maxUserJerseyPhotos,
} from "@/lib/user-jersey-photos";
import { isSupporter } from "@/lib/subscription";
import { hasExclusivityConflict } from "@/lib/patches/patch-exclusivity";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ isInCollection: false, count: 0, userJerseys: [] });
    }

    const userJerseys = await prisma.userJersey.findMany({
      where: { userId: user.id, jerseyId: id },
      orderBy: { createdAt: "asc" },
    });

    const withSignedUrls = await Promise.all(
      userJerseys.map(async (uj) => {
        const userPhotoUrls = await Promise.all(
          uj.userPhotoUrls.map((path) =>
            getR2PresignedUrl(USER_JERSEY_PHOTOS_BUCKET, path, 60 * 60)
          )
        );
        return { ...uj, userPhotoUrl: userPhotoUrls[0] ?? null, userPhotoUrls };
      })
    );

    return NextResponse.json({
      isInCollection: userJerseys.length > 0,
      count: userJerseys.length,
      userJerseys: withSignedUrls,
    });
  } catch (error) {
    console.error("GET Collection error:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Vous devez être connecté pour ajouter à votre collection" },
        { status: 401 }
      );
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: "Trop de requêtes" },
        { status: 429 }
      );
    }

    const jerseyId = id;
    const {
      version = "REPLICA",
      size,
      condition,
      hasTags = false,
      playerName,
      playerNumber,
      purchasePrice,
      purchaseDate,
      notes,
      isGift,
      isFromMysteryBox,
      userPhotoUrl,
      userPhotoUrls,
      isSigned = false,
      signedBy,
      hasAuthCertificate = false,
      certificateUrl,
      matchDescription,
      matchDate,
      hasLongSleeves = false,
      patches,
    } = await request.json();

    const fieldError = collectionItemFieldError({
      version,
      size,
      condition,
      playerName,
      playerNumber,
      purchasePrice,
      purchaseDate,
      notes,
      signedBy,
      matchDescription,
      certificateUrl,
    });
    if (fieldError) {
      return NextResponse.json({ success: false, ...fieldError }, { status: 400 });
    }

    // Photos perso : accepte le tableau userPhotoUrls, avec fallback sur l'ancien
    // champ userPhotoUrl (string unique) pour compat client.
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });
    const photosResult = normalizeUserPhotoPaths(
      userPhotoUrls !== undefined ? userPhotoUrls : userPhotoUrl,
      maxUserJerseyPhotos(isSupporter(dbUser))
    );
    if (!photosResult.ok) {
      return NextResponse.json(
        { success: false, error: photosResult.error, code: photosResult.code },
        { status: 400 }
      );
    }
    const photoPaths = photosResult.paths;

    let normalizedPatches: PatchInput[] = [];
    if (patches !== undefined && patches !== null) {
      const patchesResult = normalizePatchInputs(patches);
      if (!patchesResult.ok) {
        return NextResponse.json(
          { success: false, error: patchesResult.error, code: patchesResult.code },
          { status: 400 }
        );
      }
      normalizedPatches = patchesResult.patches;

      const referencedIds = normalizedPatches
        .map((p) => p.patchId)
        .filter((v): v is string => typeof v === "string");
      if (referencedIds.length > 0) {
        const existing = await prisma.patch.findMany({
          where: { id: { in: referencedIds } },
          select: { family: true },
        });
        if (existing.length !== referencedIds.length) {
          return NextResponse.json(
            { success: false, error: "Un ou plusieurs patches sont introuvables", code: "PATCH_NOT_FOUND" },
            { status: 400 }
          );
        }
        if (hasExclusivityConflict(existing.map((p) => p.family))) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Un maillot ne peut pas porter à la fois un badge de championnat et un badge de compétition continentale", code: "PATCH_CONFLICT",
            },
            { status: 400 }
          );
        }
      }
    }

    const [jersey, existingUserJerseyCount] = await Promise.all([
      prisma.jersey.findUnique({ where: { id: jerseyId } }),
      prisma.userJersey.count({ where: { userId: user.id } }),
    ]);

    if (!jersey) {
      return NextResponse.json(
        { success: false, error: "Maillot non trouvé", code: "JERSEY_NOT_FOUND" },
        { status: 404 }
      );
    }

    const isFirst = existingUserJerseyCount === 0;

    const parsedPurchasePrice =
      purchasePrice !== null && purchasePrice !== undefined
        ? parseFloat(purchasePrice.toString())
        : null;

    const [userJersey, deletedWishlist] = await prisma.$transaction([
      prisma.userJersey.create({
        data: {
          userId: user.id,
          jerseyId,
          version,
          size,
          condition,
          hasTags,
          playerName: playerName || null,
          playerNumber: playerNumber ? parseInt(playerNumber.toString(), 10) : null,
          purchasePrice: parsedPurchasePrice,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          notes: notes || null,
          isGift: isGift || false,
          isFromMysteryBox: isFromMysteryBox || false,
          userPhotoUrls: photoPaths,
          isSigned,
          signedBy: isSigned ? signedBy || null : null,
          hasAuthCertificate,
          certificateUrl: hasAuthCertificate ? certificateUrl || null : null,
          matchDescription: matchDescription || null,
          matchDate: matchDate ? new Date(matchDate) : null,
          hasLongSleeves: Boolean(hasLongSleeves),
          patches: normalizedPatches.length > 0
            ? {
                create: normalizedPatches.map((p) => ({
                  patchId: p.patchId ?? null,
                  customLabel: p.customLabel ?? null,
                })),
              }
            : undefined,
        },
      }),
      prisma.wishlist.deleteMany({
        where: { userId: user.id, jerseyId },
      }),
    ]);

    let newAchievements: Awaited<ReturnType<typeof checkAchievements>> = [];
    try {
      newAchievements = await checkAchievements(user.id, "collection.add");
    } catch (achievementError) {
      console.error("checkAchievements failed on collection.add:", achievementError);
    }

    try {
      await createFeedPost({
        authorId: user.id,
        type: "JERSEY_ADD",
        referenceId: userJersey.id,
      });

      // Cap collection (count = existingUserJerseyCount + 1)
      const newCount = existingUserJerseyCount + 1;
      const collectionCap = detectCollectionCap(existingUserJerseyCount, newCount);
      if (collectionCap) {
        await createFeedPost({
          authorId: user.id,
          type: "CAP_REACHED",
          capKind: collectionCap,
        });
      }

      // Cap valeur cumulée d'achat
      if (parsedPurchasePrice && parsedPurchasePrice > 0) {
        const valueAgg = await prisma.userJersey.aggregate({
          where: { userId: user.id, purchasePrice: { not: null } },
          _sum: { purchasePrice: true },
        });
        const totalAfter = Number(valueAgg._sum.purchasePrice ?? 0);
        const totalBefore = totalAfter - parsedPurchasePrice;
        const valueCap = detectValueCap(totalBefore, totalAfter);
        if (valueCap) {
          await createFeedPost({
            authorId: user.id,
            type: "CAP_REACHED",
            capKind: valueCap,
          });
        }
      }

      // Feed post pour succès PLATINUM ou LEGEND débloqué à cet ajout
      for (const achievement of newAchievements) {
        if (achievement.tier === "PLATINUM" || achievement.tier === "LEGEND") {
          await createFeedPost({
            authorId: user.id,
            type: "ACHIEVEMENT_UNLOCK",
            referenceId: achievement.id,
          });
        }
      }
    } catch (feedError) {
      console.error("createFeedPost failed on collection.add:", feedError);
    }

    return NextResponse.json({
      success: true,
      message: "Maillot ajouté à votre collection",
      userJersey,
      removedFromWishlist: deletedWishlist.count > 0,
      isFirst,
      newAchievements,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout à la collection:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
