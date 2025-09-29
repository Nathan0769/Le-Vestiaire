import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface JerseysQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  leagueId?: string;
  clubId?: string;
  season?: string;
  type?: "HOME" | "AWAY" | "THIRD" | "FOURTH" | "GOALKEEPER" | "SPECIAL";
  sortBy?: "createdAt" | "name" | "season";
  sortOrder?: "asc" | "desc";
}

interface JerseysResponse {
  jerseys: JerseyWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

type JerseyWithRelations = Prisma.JerseyGetPayload<{
  include: {
    club: {
      include: {
        league: true;
      };
    };
  };
}>;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params: JerseysQueryParams = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "12",
      search: searchParams.get("search") || undefined,
      leagueId: searchParams.get("leagueId") || undefined,
      clubId: searchParams.get("clubId") || undefined,
      season: searchParams.get("season") || undefined,
      type: searchParams.get("type") as
        | "HOME"
        | "AWAY"
        | "THIRD"
        | "FOURTH"
        | "GOALKEEPER"
        | undefined,
      sortBy:
        (searchParams.get("sortBy") as "createdAt" | "name" | "season") ||
        "createdAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    const page = Math.max(1, parseInt(params.page || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit || "12")));
    const skip = (page - 1) * limit;

    const where: Prisma.JerseyWhereInput = {};

    if (params.search) {
      where.name = {
        contains: params.search,
        mode: "insensitive",
      };
    }

    if (params.clubId) {
      where.clubId = params.clubId;
    }

    if (params.leagueId) {
      where.club = {
        leagueId: params.leagueId,
      };
    }

    if (params.season) {
      where.season = params.season;
    }

    if (params.type) {
      where.type = params.type;
    }

    const orderBy: Prisma.JerseyOrderByWithRelationInput = {};

    switch (params.sortBy) {
      case "name":
        orderBy.name = params.sortOrder;
        break;
      case "season":
        orderBy.season = params.sortOrder;
        break;
      case "createdAt":
      default:
        orderBy.createdAt = params.sortOrder;
        break;
    }

    const [jerseys, total] = await Promise.all([
      prisma.jersey.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const response: JerseysResponse = {
      jerseys,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur API /api/jerseys:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: "Erreur de base de données", code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
