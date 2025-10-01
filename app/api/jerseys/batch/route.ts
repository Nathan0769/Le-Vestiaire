import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "IDs requis" }, { status: 400 });
    }

    const jerseys = await prisma.jersey.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: {
        club: {
          include: {
            league: true,
          },
        },
      },
    });

    const orderedJerseys = ids
      .map((id) => jerseys.find((j) => j.id === id))
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
