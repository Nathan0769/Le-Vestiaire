import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { generateJerseySlug } from "@/lib/slug-generator";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const oldImagePath = oldImageUrl.split("/jersey-proposals/")[1];

    if (!oldImagePath) {
      return NextResponse.json(
        { error: "Format d'URL d'image invalide" },
        { status: 400 }
      );
    }

    const leagueName = proposal.club.league.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const clubId = proposal.clubId;
    const jerseyType = proposal.type.toLowerCase();
    const extension = oldImagePath.split(".").pop() || "jpg";
    const newImagePath = `${leagueName}/${clubId}/${proposal.season}/${jerseyType}.${extension}`;

    const { data: downloadData, error: downloadError } =
      await supabaseAdmin.storage
        .from("jersey-proposals")
        .download(oldImagePath);

    if (downloadError || !downloadData) {
      console.error("❌ Erreur téléchargement image:", downloadError);
      return NextResponse.json(
        { error: "Impossible de télécharger l'image de la proposition" },
        { status: 500 }
      );
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from("jerseys")
      .upload(newImagePath, downloadData, {
        upsert: true,
        contentType: `image/${extension}`,
      });

    if (uploadError) {
      console.error("❌ Erreur upload vers jerseys:", uploadError);
      return NextResponse.json(
        { error: "Impossible de déplacer l'image vers le bucket jerseys" },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("jerseys")
      .getPublicUrl(newImagePath);

    const newImageUrl = publicUrlData.publicUrl;

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

    const { error: deleteError } = await supabaseAdmin.storage
      .from("jersey-proposals")
      .remove([oldImagePath]);

    if (deleteError) {
      console.error(
        "⚠️ Erreur suppression image du bucket jersey-proposals:",
        deleteError
      );
    }

    return NextResponse.json({
      success: true,
      message: "Proposition approuvée avec succès",
      jersey: result.jersey,
    });
  } catch (err) {
    console.error("❌ Erreur lors de l'approbation de la proposition:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'approbation de la proposition" },
      { status: 500 }
    );
  }
}
