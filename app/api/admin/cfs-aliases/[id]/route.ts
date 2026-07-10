import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { resolveCfsMatch, loadCfsAliasMap } from "@/lib/cfs-matcher";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(["superadmin"]);
  if (error) return error;

  try {
    const { id } = await params;
    const deleted = await prisma.cfsClubAlias.delete({
      where: { id },
      select: { cfsName: true },
    });

    const affectedPromos = await prisma.cfsPromo.findMany({
      where: { club: deleted.cfsName },
      select: { id: true, name: true, club: true },
    });

    const aliasMap = await loadCfsAliasMap();
    for (const promo of affectedPromos) {
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
    }

    return NextResponse.json({
      success: true,
      unmatched: affectedPromos.length,
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "Alias introuvable" }, { status: 404 });
    }
    console.error("DELETE /api/admin/cfs-aliases/[id] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
