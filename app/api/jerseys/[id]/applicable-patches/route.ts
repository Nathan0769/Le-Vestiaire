import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { filterApplicablePatches } from "@/lib/patches/filter-applicable-patches";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimit = await checkRateLimit(standardRateLimit, identifier);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const { id } = await params;

    const jersey = await prisma.jersey.findUnique({
      where: { id },
      include: { club: { include: { league: true } } },
    });

    if (!jersey) {
      return NextResponse.json({ error: "Maillot introuvable" }, { status: 404 });
    }

    const allPatches = await prisma.patch.findMany({
      where: { isActive: true },
      include: { versions: true },
      orderBy: { name: "asc" },
    });

    const applicable = filterApplicablePatches(allPatches, jersey);
    return NextResponse.json(applicable);
  } catch (error) {
    console.error("GET applicable-patches error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
