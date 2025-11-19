import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";

export async function GET() {
  const { error } = await requirePermission({ proposal: ["view"] });
  if (error) return error;

  try {
    const proposals = await prisma.descriptionProposal.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(proposals);
  } catch (err) {
    console.error("Erreur lors de la récupération des propositions:", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des propositions" },
      { status: 500 }
    );
  }
}
