import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { deleteFromR2, JERSEY_PROPOSALS_BUCKET } from "@/lib/r2-storage";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await requirePermission({ proposal: ["reject"] });
  if (error) return error;

  try {
    const proposal = await prisma.jerseyProposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposition non trouvée" },
        { status: 404 }
      );
    }

    const imageUrl = proposal.imageUrl;
    const proposalsBaseUrl = process.env.CLOUDFLARE_R2_JERSEY_PROPOSALS_PUBLIC_URL!.replace(/\/$/, "");
    const imagePath = imageUrl.replace(`${proposalsBaseUrl}/`, "");

    await prisma.$transaction(async (tx) => {
      await tx.contributionHistory.create({
        data: {
          userId: proposal.userId,
          jerseyId: null,
          action: "REJECTED",
        },
      });

      await tx.jerseyProposal.delete({
        where: { id },
      });
    });

    if (imagePath && imagePath !== imageUrl) {
      try {
        await deleteFromR2(JERSEY_PROPOSALS_BUCKET, imagePath);
      } catch (deleteError) {
        console.error("Erreur suppression image du bucket jersey-proposals:", deleteError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Proposition rejetée",
    });
  } catch (err) {
    console.error("Erreur lors du rejet de la proposition:", err);
    return NextResponse.json(
      { error: "Erreur lors du rejet de la proposition" },
      { status: 500 }
    );
  }
}
