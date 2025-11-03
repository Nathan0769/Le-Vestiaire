import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import {
  proposalsRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { CreateProposalData } from "@/types/proposal";
import { JerseyType } from "@prisma/client";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const proposals = await prisma.jerseyProposal.findMany({
      where: { userId: user.id },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(proposals);
  } catch (err) {
    console.error("Erreur API GET jersey proposals:", err);
    return NextResponse.json(
      { error: "Erreur interne serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (
      !user.role ||
      !["contributor", "admin", "superadmin"].includes(user.role)
    ) {
      return NextResponse.json(
        { error: "Vous devez être contributeur pour proposer des maillots" },
        { status: 403 }
      );
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(proposalsRateLimit, identifier);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Trop de propositions. Réessayez plus tard.",
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    const body: CreateProposalData = await req.json();
    const { name, clubId, season, type, brand, imageUrl, description } = body;

    if (!name || !clubId || !season || !type || !brand || !imageUrl) {
      return NextResponse.json(
        { error: "Tous les champs sont obligatoires sauf la description" },
        { status: 400 }
      );
    }

    if (!Object.values(JerseyType).includes(type)) {
      return NextResponse.json(
        { error: "Type de maillot invalide" },
        { status: 400 }
      );
    }

    const clubExists = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!clubExists) {
      return NextResponse.json({ error: "Club non trouvé" }, { status: 404 });
    }

    const existingJersey = await prisma.jersey.findUnique({
      where: {
        clubId_season_type: {
          clubId,
          season,
          type,
        },
      },
    });

    if (existingJersey) {
      return NextResponse.json(
        { error: "Ce maillot existe déjà dans la base de données" },
        { status: 409 }
      );
    }

    const existingProposal = await prisma.jerseyProposal.findFirst({
      where: {
        clubId,
        season,
        type,
      },
    });

    if (existingProposal) {
      return NextResponse.json(
        { error: "Une proposition pour ce maillot est déjà en attente" },
        { status: 409 }
      );
    }

    const proposal = await prisma.$transaction(async (tx) => {
      const newProposal = await tx.jerseyProposal.create({
        data: {
          userId: user.id,
          name,
          clubId,
          season,
          type,
          brand,
          imageUrl,
          description: description || null,
        },
        include: {
          club: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logoUrl: true,
            },
          },
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          contributionsCount: {
            increment: 1,
          },
        },
      });

      return newProposal;
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (err) {
    console.error("Erreur API POST jersey proposal:", err);
    return NextResponse.json(
      { error: "Erreur interne serveur" },
      { status: 500 }
    );
  }
}
