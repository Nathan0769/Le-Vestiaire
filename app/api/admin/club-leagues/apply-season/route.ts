import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { SEASON_REGEX } from "@/lib/patches/season-format";

const bodySchema = z.object({
  season: z.string().regex(SEASON_REGEX, "Format saison invalide (YYYY-YY)"),
});

export async function POST(request: Request) {
  const { error } = await requirePermission({}, true);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    const { season } = parsed.data;

    const entries = await prisma.clubSeasonLeague.findMany({
      where: { season },
      select: { clubId: true, leagueId: true },
    });

    if (entries.length === 0) {
      return NextResponse.json({ updated: 0, total: 0 });
    }

    const byLeague = new Map<string, string[]>();
    for (const e of entries) {
      const list = byLeague.get(e.leagueId) ?? [];
      list.push(e.clubId);
      byLeague.set(e.leagueId, list);
    }

    let updated = 0;
    await prisma.$transaction(async (tx) => {
      for (const [leagueId, clubIds] of byLeague.entries()) {
        const result = await tx.club.updateMany({
          where: { id: { in: clubIds }, leagueId: { not: leagueId } },
          data: { leagueId },
        });
        updated += result.count;
      }
    });

    return NextResponse.json({ updated, total: entries.length });
  } catch (err) {
    console.error("POST admin club-leagues apply-season error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
