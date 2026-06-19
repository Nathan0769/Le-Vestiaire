import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { PatchFamily } from "@prisma/client";

const PATCH_FAMILIES = [
  "UEFA_COMPETITION",
  "CONFED_CLUB_COMPETITION",
  "FIFA_CLUB_COMPETITION",
  "DOMESTIC_LEAGUE_BADGE",
  "DOMESTIC_CHAMPION",
  "DOMESTIC_CUP",
  "DOMESTIC_SUPERCUP",
  "NATIONAL_TEAM_COMPETITION",
  "CUSTOM",
] as const;

const createPatchSchema = z.object({
  name: z.string().min(1).max(100),
  family: z.enum(PATCH_FAMILIES),
  leagueId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  notes: z.string().max(500).optional().nullable(),
  eligibleClubIds: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  const { error } = await requirePermission({}, true);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const family = searchParams.get("family");
    const leagueId = searchParams.get("leagueId");
    const isActiveParam = searchParams.get("isActive");

    const patches = await prisma.patch.findMany({
      where: {
        ...(family && PATCH_FAMILIES.includes(family as typeof PATCH_FAMILIES[number])
          ? { family: family as PatchFamily }
          : {}),
        ...(leagueId ? { leagueId } : {}),
        ...(isActiveParam !== null ? { isActive: isActiveParam === "true" } : {}),
      },
      include: {
        league: { select: { id: true, name: true, country: true } },
        versions: { orderBy: { seasonStart: "desc" } },
      },
      orderBy: [{ family: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(patches);
  } catch (err) {
    console.error("GET admin patches error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await requirePermission({}, true);
  if (error) return error;

  try {
    const body = await request.json();
    const validation = createPatchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, family, leagueId, isActive, notes, eligibleClubIds } = validation.data;

    if (leagueId) {
      const league = await prisma.league.findUnique({ where: { id: leagueId } });
      if (!league) {
        return NextResponse.json({ error: "League introuvable" }, { status: 404 });
      }
    }

    const patch = await prisma.patch.create({
      data: {
        name: name.trim(),
        family,
        leagueId: leagueId ?? null,
        isActive: isActive ?? true,
        notes: notes ?? null,
        eligibleClubIds: eligibleClubIds ?? [],
      },
      include: { versions: true, league: true },
    });

    return NextResponse.json(patch, { status: 201 });
  } catch (err) {
    console.error("POST admin patches error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
