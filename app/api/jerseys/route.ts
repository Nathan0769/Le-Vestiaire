import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  generousRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/get-current-user";

const querySchema = z.object({
  search: z.string().min(1).optional(),
  clubId: z.string().optional(),
  leagueId: z.string().optional(),
  type: z
    .enum(["HOME", "AWAY", "THIRD", "FOURTH", "GOALKEEPER", "SPECIAL"])
    .optional(),
  season: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(30),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const identifier = await getRateLimitIdentifier(user?.id);
    const rateLimitResult = await checkRateLimit(generousRateLimit, identifier);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Trop de requêtes" },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      search: searchParams.get("search") ?? undefined,
      clubId: searchParams.get("clubId") ?? undefined,
      leagueId: searchParams.get("leagueId") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      season: searchParams.get("season") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { search, clubId, leagueId, type, season, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        name: { contains: search, mode: "insensitive" as const },
      }),
      ...(clubId && { clubId }),
      ...(leagueId && { club: { leagueId } }),
      ...(type && { type }),
      ...(season && { season }),
    };

    const [jerseys, total] = await Promise.all([
      prisma.jersey.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          club: {
            include: {
              league: true,
            },
          },
        },
      }),
      prisma.jersey.count({ where }),
    ]);

    return NextResponse.json({
      jerseys,
      pagination: {
        total,
        page,
        limit,
        hasMore: skip + jerseys.length < total,
      },
    });
  } catch (error) {
    console.error("GET /api/jerseys error:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
