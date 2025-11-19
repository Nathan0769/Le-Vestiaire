import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await requirePermission({ proposal: ["reject"] });
  if (error) return error;

  const adminUser = await getCurrentUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { reason } = body;

    const proposal = await prisma.descriptionProposal.findUnique({
      where: { id },
      include: {
        user: true,
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

    await prisma.$transaction(async (tx) => {
      await tx.descriptionProposal.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason: reason || null,
          reviewedBy: adminUser.id,
          reviewedAt: new Date(),
        },
      });

      await tx.contributionHistory.create({
        data: {
          userId: proposal.userId,
          jerseyId: proposal.jerseyId,
          action: "description_rejected",
        },
      });
    });

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
