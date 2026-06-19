import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { SEASON_REGEX } from "@/lib/patches/season-format";

const createSchema = z.object({
  clubId: z.string().min(1),
  season: z.string().regex(SEASON_REGEX, "Format saison invalide (YYYY-YY)"),
  leagueId: z.string().min(1),
});

export async function GET(request: Request) {
  const { error } = await requirePermission({}, true);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get("leagueId");
    const season = searchParams.get("season");

    const entries = await prisma.clubSeasonLeague.findMany({
      where: {
        ...(leagueId ? { leagueId } : {}),
        ...(season ? { season } : {}),
      },
      include: {
        club: {
          select: { id: true, name: true, shortName: true, logoUrl: true },
        },
        league: { select: { id: true, name: true } },
      },
      orderBy: [{ season: "desc" }, { club: { name: "asc" } }],
    });

    return NextResponse.json(entries);
  } catch (err) {
    console.error("GET admin club-leagues error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await requirePermission({}, true);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    const entry = await prisma.clubSeasonLeague.create({
      data: parsed.data,
      include: {
        club: {
          select: { id: true, name: true, shortName: true, logoUrl: true },
        },
        league: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ce club a déjà une ligue pour cette saison" },
        { status: 409 }
      );
    }
    console.error("POST admin club-leagues error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
