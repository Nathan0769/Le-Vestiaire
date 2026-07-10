import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { resolveCfsMatch, loadCfsAliasMap } from "@/lib/cfs-matcher";

const CreateAliasSchema = z.object({
  cfsName: z.string().min(1).max(200),
  clubId: z.string().min(1),
});

export async function GET() {
  const { error } = await requireRole(["superadmin"]);
  if (error) return error;

  try {
    const aliases = await prisma.cfsClubAlias.findMany({
      include: {
        club: { select: { id: true, name: true, shortName: true } },
      },
      orderBy: { cfsName: "asc" },
    });
    return NextResponse.json({ aliases });
  } catch (err) {
    console.error("GET /api/admin/cfs-aliases error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await requireRole(["superadmin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = CreateAliasSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const alias = await prisma.cfsClubAlias.create({
      data: parsed.data,
      include: {
        club: { select: { id: true, name: true, shortName: true } },
      },
    });

    const pendingPromos = await prisma.cfsPromo.findMany({
      where: {
        club: parsed.data.cfsName,
        matchStatus: { not: "MATCHED" },
      },
      select: { id: true, name: true, club: true },
    });

    const aliasMap = await loadCfsAliasMap();
    let rematched = 0;
    for (const promo of pendingPromos) {
      const match = await resolveCfsMatch(
        { name: promo.name, club: promo.club },
        aliasMap
      );
      await prisma.cfsPromo.update({
        where: { id: promo.id },
        data: {
          jerseyId: match.jerseyId,
          season: match.season,
          type: match.type,
          matchStatus: match.matchStatus,
        },
      });
      if (match.matchStatus === "MATCHED") rematched++;
    }

    return NextResponse.json(
      { alias, rematched, evaluated: pendingPromos.length },
      { status: 201 }
    );
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json({ error: "Alias déjà existant" }, { status: 409 });
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      return NextResponse.json({ error: "Club introuvable" }, { status: 400 });
    }
    console.error("POST /api/admin/cfs-aliases error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
