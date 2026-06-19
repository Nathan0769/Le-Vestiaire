import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { error } = await requirePermission({}, true);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const leagueIdsParam = searchParams.get("leagueIds");
    const leagueIds = leagueIdsParam
      ? leagueIdsParam.split(",").map((s) => s.trim()).filter(Boolean)
      : null;

    const clubs = await prisma.club.findMany({
      where: leagueIds && leagueIds.length > 0 ? { leagueId: { in: leagueIds } } : undefined,
      select: {
        id: true,
        name: true,
        shortName: true,
        logoUrl: true,
        league: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(clubs);
  } catch (err) {
    console.error("GET admin clubs error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
