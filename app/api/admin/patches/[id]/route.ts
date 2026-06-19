import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { deleteFromR2, PATCHES_BUCKET } from "@/lib/r2-storage";

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

const updatePatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  family: z.enum(PATCH_FAMILIES).optional(),
  leagueId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  notes: z.string().max(500).optional().nullable(),
  eligibleClubIds: z.array(z.string()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission({}, true);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const validation = updatePatchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.patch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Patch introuvable" }, { status: 404 });
    }

    if (validation.data.leagueId) {
      const league = await prisma.league.findUnique({
        where: { id: validation.data.leagueId },
      });
      if (!league) {
        return NextResponse.json({ error: "League introuvable" }, { status: 404 });
      }
    }

    const updated = await prisma.patch.update({
      where: { id },
      data: {
        ...(validation.data.name !== undefined && { name: validation.data.name.trim() }),
        ...(validation.data.family !== undefined && { family: validation.data.family }),
        ...(validation.data.leagueId !== undefined && {
          leagueId: validation.data.leagueId ?? null,
        }),
        ...(validation.data.isActive !== undefined && { isActive: validation.data.isActive }),
        ...(validation.data.notes !== undefined && { notes: validation.data.notes ?? null }),
        ...(validation.data.eligibleClubIds !== undefined && {
          eligibleClubIds: validation.data.eligibleClubIds,
        }),
      },
      include: { versions: true, league: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH admin patch error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission({}, true);
  if (error) return error;

  try {
    const { id } = await params;

    const existing = await prisma.patch.findUnique({
      where: { id },
      include: { versions: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Patch introuvable" }, { status: 404 });
    }

    const r2Keys = existing.versions
      .map((v) => extractR2Key(v.imageUrl))
      .filter((k): k is string => k !== null);

    await prisma.patch.delete({ where: { id } });

    await Promise.all(
      r2Keys.map(async (key) => {
        try {
          await deleteFromR2(PATCHES_BUCKET, key);
        } catch (e) {
          console.error("R2 cleanup failed for key", key, e);
        }
      })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE admin patch error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function extractR2Key(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  const publicBase = process.env.CLOUDFLARE_R2_PATCHES_PUBLIC_URL?.replace(/\/$/, "");
  if (!publicBase || !imageUrl.startsWith(publicBase)) return null;
  return imageUrl.slice(publicBase.length + 1);
}
