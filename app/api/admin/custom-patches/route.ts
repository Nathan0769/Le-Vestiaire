import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/check-permission";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { groupCustomPatches } from "@/lib/patches/custom-patch-label";
import type { CustomPatchOccurrence } from "@/types/patch";

export async function GET() {
  const { error, session } = await requirePermission({}, true);
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const rows = await prisma.userJerseyPatch.findMany({
      where: { patchId: null, customLabel: { not: null } },
      select: {
        id: true,
        customLabel: true,
        userJerseyId: true,
        userJersey: {
          select: {
            user: { select: { username: true } },
            jersey: {
              select: {
                id: true,
                name: true,
                season: true,
                clubId: true,
                club: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const occurrences: CustomPatchOccurrence[] = rows.map((r) => ({
      id: r.id,
      customLabel: r.customLabel!,
      userJerseyId: r.userJerseyId,
      username: r.userJersey.user.username,
      jersey: {
        id: r.userJersey.jersey.id,
        name: r.userJersey.jersey.name,
        season: r.userJersey.jersey.season,
        clubId: r.userJersey.jersey.clubId,
        clubName: r.userJersey.jersey.club.name,
      },
    }));

    return NextResponse.json(groupCustomPatches(occurrences));
  } catch (err) {
    console.error("GET admin custom patches error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
