import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { Prisma } from "@prisma/client";
import {
  getR2PresignedUrl,
  deleteFromR2,
  USER_JERSEY_PHOTOS_BUCKET,
} from "@/lib/r2-storage";
import {
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";

const VALID_VERSIONS = ["REPLICA", "AUTHENTIC", "STOCK_PRO", "PLAYER_ISSUE", "MATCH_WORN"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour modifier votre collection" },
        { status: 401 }
      );
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const existing = await prisma.userJersey.findUnique({ where: { id } });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Maillot introuvable dans votre collection" },
        { status: 404 }
      );
    }

    const {
      version,
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
      hasLongSleeves,
      patches,
    } = await request.json();

    if (version && !VALID_VERSIONS.includes(version)) {
      return NextResponse.json(
        { error: "Version de maillot invalide" },
        { status: 400 }
      );
    }

    if (!condition) {
      return NextResponse.json(
        { error: "L'état est obligatoire" },
        { status: 400 }
      );
    }

    if (playerName && playerName.length > 100) {
      return NextResponse.json(
        { error: "Le nom du joueur ne peut pas dépasser 100 caractères" },
        { status: 400 }
      );
    }

    if (playerNumber !== null && playerNumber !== undefined) {
      const num = parseInt(playerNumber.toString(), 10);
      if (isNaN(num) || num < 1 || num > 999) {
        return NextResponse.json(
          { error: "Le numéro de maillot doit être compris entre 1 et 999" },
          { status: 400 }
        );
      }
    }

    if (notes && notes.length > 1000) {
      return NextResponse.json(
        { error: "Les notes ne peuvent pas dépasser 1000 caractères" },
        { status: 400 }
      );
    }

    if (signedBy && signedBy.length > 500) {
      return NextResponse.json(
        { error: "Le champ 'signé par' ne peut pas dépasser 500 caractères" },
        { status: 400 }
      );
    }

    if (matchDescription && matchDescription.length > 500) {
      return NextResponse.json(
        { error: "La description du match ne peut pas dépasser 500 caractères" },
        { status: 400 }
      );
    }

    if (certificateUrl) {
      if (certificateUrl.length > 2048) {
        return NextResponse.json(
          { error: "L'URL du certificat est trop longue" },
          { status: 400 }
        );
      }
      try {
        const parsed = new URL(certificateUrl);
        if (parsed.protocol !== "https:") {
          return NextResponse.json(
            { error: "L'URL du certificat doit commencer par https://" },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "L'URL du certificat est invalide" },
          { status: 400 }
        );
      }
    }

    if (purchasePrice !== null && purchasePrice !== undefined) {
      const parsedPrice = parseFloat(purchasePrice.toString());
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json(
          { error: "Le prix d'achat doit être un nombre positif valide" },
          { status: 400 }
        );
      }
    }

    type PatchInput = { patchId?: string; customLabel?: string };
    let normalizedPatches: PatchInput[] | null = null;
    if (patches !== undefined && patches !== null) {
      if (!Array.isArray(patches)) {
        return NextResponse.json(
          { error: "patches doit être un tableau" },
          { status: 400 }
        );
      }
      normalizedPatches = [];
      const seenPatchIds = new Set<string>();
      for (const raw of patches as PatchInput[]) {
        const patchId = typeof raw.patchId === "string" ? raw.patchId : undefined;
        const customLabel =
          typeof raw.customLabel === "string" ? raw.customLabel.trim() : undefined;
        if (!patchId && !customLabel) {
          return NextResponse.json(
            { error: "Chaque patch doit avoir un patchId ou un customLabel" },
            { status: 400 }
          );
        }
        if (customLabel && customLabel.length > 50) {
          return NextResponse.json(
            { error: "Le label personnalisé ne peut pas dépasser 50 caractères" },
            { status: 400 }
          );
        }
        if (patchId) {
          if (seenPatchIds.has(patchId)) continue;
          seenPatchIds.add(patchId);
        }
        normalizedPatches.push({ patchId, customLabel: customLabel || undefined });
      }

      const refIds = normalizedPatches
        .map((p) => p.patchId)
        .filter((v): v is string => typeof v === "string");
      if (refIds.length > 0) {
        const existsCount = await prisma.patch.count({
          where: { id: { in: refIds } },
        });
        if (existsCount !== refIds.length) {
          return NextResponse.json(
            { error: "Un ou plusieurs patches sont introuvables" },
            { status: 400 }
          );
        }
      }
    }

    if (userPhotoUrl === null && existing.userPhotoUrl) {
      try {
        await deleteFromR2(USER_JERSEY_PHOTOS_BUCKET, existing.userPhotoUrl);
      } catch (err) {
        console.error("Erreur suppression ancienne photo:", err);
      }
    }

    const parsedPurchasePrice =
      purchasePrice !== null && purchasePrice !== undefined
        ? parseFloat(purchasePrice.toString())
        : null;

    const updateData: Prisma.UserJerseyUpdateInput = {
      ...(version && { version }),
      size: size || null,
      condition,
      hasTags,
      playerName: playerName || null,
      playerNumber: playerNumber
        ? parseInt(playerNumber.toString(), 10)
        : null,
      purchasePrice: parsedPurchasePrice,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      notes: notes || null,
      isGift: isGift || false,
      isFromMysteryBox: isFromMysteryBox || false,
      isSigned,
      signedBy: isSigned ? signedBy || null : null,
      hasAuthCertificate,
      certificateUrl: hasAuthCertificate ? certificateUrl || null : null,
      matchDescription: matchDescription || null,
      matchDate: matchDate ? new Date(matchDate) : null,
      ...(hasLongSleeves !== undefined && { hasLongSleeves: Boolean(hasLongSleeves) }),
      updatedAt: new Date(),
      ...(userPhotoUrl !== undefined && { userPhotoUrl: userPhotoUrl || null }),
    };

    const updated = await prisma.$transaction(async (tx) => {
      if (normalizedPatches !== null) {
        await tx.userJerseyPatch.deleteMany({ where: { userJerseyId: id } });
        if (normalizedPatches.length > 0) {
          await tx.userJerseyPatch.createMany({
            data: normalizedPatches.map((p) => ({
              userJerseyId: id,
              patchId: p.patchId ?? null,
              customLabel: p.customLabel ?? null,
            })),
          });
        }
      }
      return tx.userJersey.update({
        where: { id },
        data: updateData,
        include: {
          jersey: {
            include: {
              club: {
                include: { league: true },
              },
            },
          },
          patches: {
            include: {
              patch: { include: { versions: true } },
            },
          },
        },
      });
    });

    let signedPhotoUrl = null;
    if (updated.userPhotoUrl) {
      signedPhotoUrl = await getR2PresignedUrl(
        USER_JERSEY_PHOTOS_BUCKET,
        updated.userPhotoUrl,
        60 * 60
      );
    }

    return NextResponse.json({
      success: true,
      message: "Maillot mis à jour avec succès",
      userJersey: {
        ...updated,
        purchasePrice: updated.purchasePrice
          ? Number(updated.purchasePrice)
          : null,
        userPhotoUrl: signedPhotoUrl,
        jersey: {
          ...updated.jersey,
          retailPrice: updated.jersey.retailPrice
            ? Number(updated.jersey.retailPrice)
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Erreur PATCH /api/user-jerseys/[id]:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté" },
        { status: 401 }
      );
    }

    const deleteIdentifier = await getRateLimitIdentifier(user.id);
    const deleteRateLimit = await checkRateLimit(moderateRateLimit, deleteIdentifier);
    if (!deleteRateLimit.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const existing = await prisma.userJersey.findUnique({ where: { id } });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Maillot introuvable dans votre collection" },
        { status: 404 }
      );
    }

    if (existing.userPhotoUrl) {
      try {
        await deleteFromR2(USER_JERSEY_PHOTOS_BUCKET, existing.userPhotoUrl);
      } catch (err) {
        console.error("Erreur suppression photo:", err);
      }
    }

    await prisma.userJersey.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Maillot retiré de votre collection",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/user-jerseys/[id]:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
