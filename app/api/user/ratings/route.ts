import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { standardRateLimit, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";

const PAGE_SIZE = 100;

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
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
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.rating.count({ where: { userId: user.id } }),
    ]);

    const items = ratings.map((r) => ({
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

    return NextResponse.json({
      items,
      page,
      pageSize: PAGE_SIZE,
      total,
      hasMore: page * PAGE_SIZE < total,
    });
  } catch (error) {
    console.error("Erreur GET /api/user/ratings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
