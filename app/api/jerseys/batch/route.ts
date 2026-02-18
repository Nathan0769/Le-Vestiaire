import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";

const MAX_BATCH_SIZE = 50;

export async function POST(request: Request) {
  try {
    const identifier = await getRateLimitIdentifier();
    const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Trop de requêtes" },
        { status: 429 }
      );
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "IDs requis" }, { status: 400 });
    }

    if (ids.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BATCH_SIZE} IDs par requête` },
        { status: 400 }
      );
    }

    if (!ids.every((id: unknown) => typeof id === "string")) {
      return NextResponse.json(
        { error: "Tous les IDs doivent être des chaînes" },
        { status: 400 }
      );
    }

    const jerseys = await prisma.jersey.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            shortName: true,
            league: true,
          },
        },
      },
    });

    const orderedJerseys = ids
      .map((id: string) => jerseys.find((j) => j.id === id))
      .filter(Boolean);

    return NextResponse.json(orderedJerseys);
  } catch (error) {
    console.error("Erreur récupération jerseys:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
