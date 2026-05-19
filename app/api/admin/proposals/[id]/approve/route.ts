import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { generateJerseySlug } from "@/lib/slug-generator";
import {
  uploadToR2,
  getR2PublicUrl,
  downloadFromR2,
  deleteFromR2,
  JERSEY_PROPOSALS_BUCKET,
} from "@/lib/r2-storage";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await requirePermission({ proposal: ["approve"] });
  if (error) return error;

  try {
    const proposal = await prisma.jerseyProposal.findUnique({
      where: { id },
      include: {
        user: true,
        club: {
          include: {
            league: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposition non trouvée" },
        { status: 404 }
      );
    }

    const existingJersey = await prisma.jersey.findUnique({
      where: {
        clubId_season_type: {
          clubId: proposal.clubId,
          season: proposal.season,
          type: proposal.type,
        },
      },
    });

    if (existingJersey) {
      return NextResponse.json(
        { error: "Un maillot avec ces caractéristiques existe déjà" },
        { status: 409 }
      );
    }

    const oldImageUrl = proposal.imageUrl;
    const proposalsBaseUrl = process.env.CLOUDFLARE_R2_JERSEY_PROPOSALS_PUBLIC_URL!.replace(/\/$/, "");
    const oldImagePath = oldImageUrl.replace(`${proposalsBaseUrl}/`, "");

    if (!oldImagePath || oldImagePath === oldImageUrl) {
      return NextResponse.json(
        { error: "Format d'URL d'image invalide" },
        { status: 400 }
      );
    }

    const leagueName = proposal.club.league.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    const clubId = proposal.clubId;
    const jerseyType = proposal.type.toLowerCase();
    const extension = oldImagePath.split(".").pop() || "jpg";
    const newImagePath = `${leagueName}/${clubId}/${proposal.season}/${jerseyType}.${extension}`;

    let imageBuffer: Buffer;
    try {
      imageBuffer = await downloadFromR2(JERSEY_PROPOSALS_BUCKET, oldImagePath);
    } catch (downloadError) {
      console.error("Erreur téléchargement image:", downloadError);
      return NextResponse.json(
        { error: "Impossible de télécharger l'image de la proposition" },
        { status: 500 }
      );
    }

    try {
      await uploadToR2("jerseys", newImagePath, imageBuffer, `image/${extension}`);
    } catch (uploadError) {
      console.error("Erreur upload vers R2 jerseys:", uploadError);
      return NextResponse.json(
        { error: "Impossible de déplacer l'image vers le bucket jerseys" },
        { status: 500 }
      );
    }

    const newImageUrl = getR2PublicUrl("jerseys", newImagePath);

    const result = await prisma.$transaction(async (tx) => {
      const jersey = await tx.jersey.create({
        data: {
          name: proposal.name,
          clubId: proposal.clubId,
          season: proposal.season,
          type: proposal.type,
          brand: proposal.brand,
          imageUrl: newImageUrl,
          description: proposal.description,
          retailPrice: null,
          slug: generateJerseySlug(proposal.club.shortName, proposal.type, proposal.season),
        },
      });

      await tx.user.update({
        where: { id: proposal.userId },
        data: {
          approvedContributionsCount: {
            increment: 1,
          },
        },
      });

      await tx.contributionHistory.create({
        data: {
          userId: proposal.userId,
          jerseyId: jersey.id,
          action: "APPROVED",
        },
      });

      await tx.jerseyProposal.delete({
        where: { id },
      });

      return { jersey };
    });

    try {
      await deleteFromR2(JERSEY_PROPOSALS_BUCKET, oldImagePath);
    } catch (deleteError) {
      console.error("Erreur suppression image du bucket jersey-proposals:", deleteError);
    }

    return NextResponse.json({
      success: true,
      message: "Proposition approuvée avec succès",
      jersey: result.jersey,
    });
  } catch (err) {
    console.error("Erreur lors de l'approbation de la proposition:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'approbation de la proposition" },
      { status: 500 }
    );
  }
}
