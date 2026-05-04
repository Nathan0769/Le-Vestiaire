import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { standardRateLimit, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const ratings = await prisma.rating.findMany({
      where: { userId: user.id },
      include: {
        jersey: {
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
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const result = ratings.map((r) => ({
      id: r.id,
      rating: Number(r.rating),
      createdAt: r.createdAt.toISOString(),
      jersey: {
        id: r.jersey.id,
        name: r.jersey.name,
        season: r.jersey.season,
        type: r.jersey.type,
        brand: r.jersey.brand,
        imageUrl: r.jersey.imageUrl,
        slug: r.jersey.slug,
        clubId: r.jersey.clubId,
        retailPrice: r.jersey.retailPrice ? Number(r.jersey.retailPrice) : null,
        club: r.jersey.club,
      },
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur GET /api/user/ratings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
