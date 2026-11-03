import { NextResponse } from "next/server";
import { requireRole } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { fetchCfsTeams } from "@/lib/cfs-constructor";
import { normalizeClubName } from "@/lib/partner-shops/club-name";

export const maxDuration = 60;

/**
 * Équipes CFS sans alias vers un club du catalogue (facette `team` de l'API),
 * de la plus fournie à la moins fournie. Le nom affiché est celui de CFS : c'est
 * lui qu'il faut enregistrer comme alias.
 */
export async function GET() {
  const { error } = await requireRole(["superadmin"]);
  if (error) return error;

  try {
    const [teams, aliases] = await Promise.all([
      fetchCfsTeams(),
      prisma.cfsClubAlias.findMany({ select: { cfsName: true } }),
    ]);
    const mapped = new Set(aliases.map((a) => normalizeClubName(a.cfsName)));

    const discovered = teams
      .filter((t) => !mapped.has(normalizeClubName(t.name)))
      .map((t) => ({ slug: t.name, displayName: t.name, productCount: t.count }))
      .sort((a, b) => b.productCount - a.productCount);

    return NextResponse.json({ clubs: discovered });
  } catch (err) {
    console.error("GET /api/admin/cfs-availability/discover error:", err);
    return NextResponse.json({ error: "Erreur lors de la découverte" }, { status: 500 });
  }
}
