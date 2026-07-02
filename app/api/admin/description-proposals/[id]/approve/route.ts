import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { translateDescription } from "@/lib/deepl";
import { checkAchievements } from "@/lib/achievements/check";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await requirePermission({ proposal: ["approve"] });
  if (error) return error;

  const adminUser = await getCurrentUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const proposal = await prisma.descriptionProposal.findUnique({
      where: { id },
      include: {
        user: true,
        jersey: true,
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposition non trouvée" },
        { status: 404 }
      );
    }

    if (proposal.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette proposition a déjà été traitée" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedJersey = await tx.jersey.update({
        where: { id: proposal.jerseyId },
        data: {
          description: proposal.description,
        },
      });

      await tx.descriptionProposal.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedBy: adminUser.id,
          reviewedAt: new Date(),
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
          jerseyId: proposal.jerseyId,
          action: "description_approved",
        },
      });

      return { updatedJersey };
    });

    let translationSuccess = false;
    try {
      const translations = await translateDescription(proposal.description);
      await prisma.jersey.update({
        where: { id: proposal.jerseyId },
        data: { descriptionTranslations: translations },
      });
      translationSuccess = true;
    } catch (err) {
      console.error("Traduction automatique échouée pour le maillot", proposal.jerseyId, err);
    }

    try {
      await checkAchievements(proposal.userId, "contribution.description_accepted");
    } catch (achievementError) {
      console.error("checkAchievements failed on contribution.description_accepted:", achievementError);
    }

    return NextResponse.json({
      success: true,
      message: "Proposition approuvée avec succès",
      translationSuccess,
      jersey: result.updatedJersey,
    });
  } catch (err) {
    console.error("Erreur lors de l'approbation de la proposition:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'approbation de la proposition" },
      { status: 500 }
    );
  }
}
