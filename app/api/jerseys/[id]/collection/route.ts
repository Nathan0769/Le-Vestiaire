import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { getR2PresignedUrl, USER_JERSEY_PHOTOS_BUCKET } from "@/lib/r2-storage";
import {
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";

const VALID_VERSIONS = ["REPLICA", "AUTHENTIC", "STOCK_PRO", "PLAYER_ISSUE", "MATCH_WORN"] as const;

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
        const userPhotoUrl = uj.userPhotoUrl
          ? await getR2PresignedUrl(USER_JERSEY_PHOTOS_BUCKET, uj.userPhotoUrl, 60 * 60)
          : null;
        return { ...uj, userPhotoUrl };
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
      isSigned = false,
      signedBy,
      hasAuthCertificate = false,
      certificateUrl,
      matchDescription,
      matchDate,
      hasLongSleeves = false,
      patches,
    } = await request.json();

    if (version && !VALID_VERSIONS.includes(version)) {
      return NextResponse.json(
        { success: false, error: "Version de maillot invalide" },
        { status: 400 }
      );
    }

    if (!condition) {
      return NextResponse.json(
        { success: false, error: "L'état est obligatoire" },
        { status: 400 }
      );
    }

    if (playerName && playerName.length > 100) {
      return NextResponse.json(
        { success: false, error: "Le nom du joueur ne peut pas dépasser 100 caractères" },
        { status: 400 }
      );
    }

    if (playerNumber !== null && playerNumber !== undefined) {
      const num = parseInt(playerNumber.toString(), 10);
      if (isNaN(num) || num < 1 || num > 999) {
        return NextResponse.json(
          { success: false, error: "Le numéro de maillot doit être compris entre 1 et 999" },
          { status: 400 }
        );
      }
    }

    if (notes && notes.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Les notes ne peuvent pas dépasser 1000 caractères" },
        { status: 400 }
      );
    }

    if (signedBy && signedBy.length > 500) {
      return NextResponse.json(
        { success: false, error: "Le champ 'signé par' ne peut pas dépasser 500 caractères" },
        { status: 400 }
      );
    }

    if (matchDescription && matchDescription.length > 500) {
      return NextResponse.json(
        { success: false, error: "La description du match ne peut pas dépasser 500 caractères" },
        { status: 400 }
      );
    }

    if (certificateUrl) {
      if (certificateUrl.length > 2048) {
        return NextResponse.json(
          { success: false, error: "L'URL du certificat est trop longue" },
          { status: 400 }
        );
      }
      try {
        const parsed = new URL(certificateUrl);
        if (parsed.protocol !== "https:") {
          return NextResponse.json(
            { success: false, error: "L'URL du certificat doit commencer par https://" },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: "L'URL du certificat est invalide" },
          { status: 400 }
        );
      }
    }

    if (purchasePrice !== null && purchasePrice !== undefined) {
      const parsedPrice = parseFloat(purchasePrice.toString());
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json(
          { success: false, error: "Le prix d'achat doit être un nombre positif valide" },
          { status: 400 }
        );
      }
    }

    type PatchInput = { patchId?: string; customLabel?: string };
    let normalizedPatches: PatchInput[] = [];
    if (patches !== undefined && patches !== null) {
      if (!Array.isArray(patches)) {
        return NextResponse.json(
          { success: false, error: "patches doit être un tableau" },
          { status: 400 }
        );
      }
      const seenPatchIds = new Set<string>();
      for (const raw of patches as PatchInput[]) {
        const patchId = typeof raw.patchId === "string" ? raw.patchId : undefined;
        const customLabel =
          typeof raw.customLabel === "string" ? raw.customLabel.trim() : undefined;

        if (!patchId && !customLabel) {
          return NextResponse.json(
            { success: false, error: "Chaque patch doit avoir un patchId ou un customLabel" },
            { status: 400 }
          );
        }
        if (customLabel && customLabel.length > 50) {
          return NextResponse.json(
            { success: false, error: "Le label personnalisé ne peut pas dépasser 50 caractères" },
            { status: 400 }
          );
        }
        if (patchId) {
          if (seenPatchIds.has(patchId)) continue;
          seenPatchIds.add(patchId);
        }
        normalizedPatches.push({ patchId, customLabel: customLabel || undefined });
      }

      const referencedIds = normalizedPatches
        .map((p) => p.patchId)
        .filter((v): v is string => typeof v === "string");
      if (referencedIds.length > 0) {
        const existing = await prisma.patch.findMany({
          where: { id: { in: referencedIds } },
          select: { id: true },
        });
        if (existing.length !== referencedIds.length) {
          return NextResponse.json(
            { success: false, error: "Un ou plusieurs patches sont introuvables" },
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
        { success: false, error: "Maillot non trouvé" },
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
          size: size || null,
          condition,
          hasTags,
          playerName: playerName || null,
          playerNumber: playerNumber ? parseInt(playerNumber.toString(), 10) : null,
          purchasePrice: parsedPurchasePrice,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          notes: notes || null,
          isGift: isGift || false,
          isFromMysteryBox: isFromMysteryBox || false,
          userPhotoUrl: userPhotoUrl || null,
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

    return NextResponse.json({
      success: true,
      message: "Maillot ajouté à votre collection",
      userJersey,
      removedFromWishlist: deletedWishlist.count > 0,
      isFirst,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout à la collection:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
