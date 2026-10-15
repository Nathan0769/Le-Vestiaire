import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/check-permission";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import {
  computeEligibilityAdditions,
  planCustomPatchLink,
} from "@/lib/patches/custom-patch-link";

const linkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  patchId: z.string().min(1),
  extendEligibility: z.boolean(),
});

export async function POST(request: Request) {
  const { error, session } = await requirePermission({}, true);
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const validation = linkSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }
    const { ids, patchId, extendEligibility } = validation.data;

    const patch = await prisma.patch.findUnique({
      where: { id: patchId },
      include: { versions: true },
    });
    if (!patch) {
      return NextResponse.json({ error: "Patch introuvable" }, { status: 404 });
    }

    // patchId: null : une ligne rattachée entre-temps n'est plus un patch perso.
    const rows = await prisma.userJerseyPatch.findMany({
      where: { id: { in: ids }, patchId: null },
      select: {
        id: true,
        userJerseyId: true,
        userJersey: {
          select: {
            jersey: { select: { clubId: true, season: true } },
            patches: { select: { patchId: true } },
          },
        },
      },
    });

    const { toUpdate, toDelete } = planCustomPatchLink(
      rows.map((r) => ({
        id: r.id,
        userJerseyId: r.userJerseyId,
        existingPatchIds: r.userJersey.patches
          .map((p) => p.patchId)
          .filter((id): id is string => id !== null),
      })),
      patchId
    );

    const linkedRows = rows.filter((r) => toUpdate.includes(r.id));
    const eligibility = extendEligibility
      ? computeEligibilityAdditions(
          patch,
          linkedRows.map((r) => r.userJersey.jersey)
        )
      : { patchClubIds: null, versionUpdates: [] };

    const [deleted, updated] = await prisma.$transaction([
      prisma.userJerseyPatch.deleteMany({
        where: { id: { in: toDelete }, patchId: null },
      }),
      prisma.userJerseyPatch.updateMany({
        where: { id: { in: toUpdate }, patchId: null },
        data: { patchId, customLabel: null },
      }),
      ...(eligibility.patchClubIds
        ? [
            prisma.patch.update({
              where: { id: patchId },
              data: { eligibleClubIds: eligibility.patchClubIds },
            }),
          ]
        : []),
      ...eligibility.versionUpdates.map((v) =>
        prisma.patchVersion.update({
          where: { id: v.versionId },
          data: { eligibleClubIds: v.clubIds },
        })
      ),
    ]);

    return NextResponse.json({ updated: updated.count, deleted: deleted.count });
  } catch (err) {
    console.error("POST admin custom patches link error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
