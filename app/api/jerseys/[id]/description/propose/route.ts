import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { z } from "zod";

const proposeDescriptionSchema = z.object({
  description: z
    .string()
    .min(50, "La description doit contenir au moins 50 caractères")
    .max(2000, "La description ne peut pas dépasser 2000 caractères")
    .trim(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jerseyId } = await params;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour proposer une description" },
        { status: 401 }
      );
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez réessayer plus tard." },
        { status: 429 }
      );
    }

    const jersey = await prisma.jersey.findUnique({
      where: { id: jerseyId },
    });

    if (!jersey) {
      return NextResponse.json(
        { error: "Maillot introuvable" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = proposeDescriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { description } = validation.data;

    const existingProposal = await prisma.descriptionProposal.findFirst({
      where: {
        userId: user.id,
        jerseyId,
        status: "PENDING",
      },
    });

    if (existingProposal) {
      return NextResponse.json(
        {
          error:
            "Vous avez déjà une proposition en attente pour ce maillot. Veuillez attendre qu'elle soit traitée.",
        },
        { status: 400 }
      );
    }

    const proposal = await prisma.descriptionProposal.create({
      data: {
        userId: user.id,
        jerseyId,
        description,
        status: "PENDING",
      },
    });

    await prisma.contributionHistory.create({
      data: {
        userId: user.id,
        jerseyId,
        action: "description_proposed",
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        contributionsCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Votre proposition a été soumise avec succès ! Elle sera examinée par notre équipe.",
        proposalId: proposal.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error proposing description:", error);
    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors de la soumission de votre proposition",
      },
      { status: 500 }
    );
  }
}
