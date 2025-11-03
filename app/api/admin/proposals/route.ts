import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/check-permission";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: Request) {
  const { error, session } = await requirePermission({ proposal: ["list"] });
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const proposals = await prisma.jerseyProposal.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            contributionsCount: true,
            approvedContributionsCount: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ proposals });
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des propositions:", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des propositions" },
      { status: 500 }
    );
  }
}
