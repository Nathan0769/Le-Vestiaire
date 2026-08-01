import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { validateImageFile } from "@/lib/file-validation";
import { uploadToR2, deleteFromR2, getR2PublicUrl, PATCHES_BUCKET } from "@/lib/r2-storage";
import { validatePatchVersionPeriod } from "@/lib/patches/season-format";
import crypto from "crypto";

const MAX_PATCH_IMAGE_SIZE = 2 * 1024 * 1024;

const updateMetaSchema = z.object({
  seasonStart: z.string().optional(),
  seasonEnd: z.string().optional().nullable(),
  eligibleClubIds: z.array(z.string()).optional(),
});

function extractR2Key(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  const publicBase = process.env.CLOUDFLARE_R2_PATCHES_PUBLIC_URL?.replace(/\/$/, "");
  if (!publicBase || !imageUrl.startsWith(publicBase)) return null;
  return imageUrl.slice(publicBase.length + 1);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { error } = await requirePermission({}, true);
  if (error) return error;

  try {
    const { id: patchId, versionId } = await params;

    const existing = await prisma.patchVersion.findUnique({
      where: { id: versionId },
      include: { patch: true },
    });
    if (!existing || existing.patchId !== patchId) {
      return NextResponse.json({ error: "Version introuvable" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    let seasonStart: string | undefined;
    let seasonEnd: string | null | undefined;
    let eligibleClubIds: string[] | undefined;
    let newImageUrl: string | undefined;
    let oldImageKey: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const ss = formData.get("seasonStart");
      const se = formData.get("seasonEnd");
      const ec = formData.get("eligibleClubIds");
      const file = formData.get("file");

      let parsedClubIds: string[] | undefined;
      if (typeof ec === "string" && ec.length > 0) {
        try {
          const parsed = JSON.parse(ec);
          if (
            !Array.isArray(parsed) ||
            !parsed.every((v) => typeof v === "string")
          ) {
            return NextResponse.json(
              { error: "eligibleClubIds doit etre un tableau de strings" },
              { status: 400 }
            );
          }
          parsedClubIds = parsed;
        } catch {
          return NextResponse.json(
            { error: "eligibleClubIds JSON invalide" },
            { status: 400 }
          );
        }
      }

      const meta = updateMetaSchema.safeParse({
        seasonStart: typeof ss === "string" && ss ? ss : undefined,
        seasonEnd: se === null || se === "" ? null : typeof se === "string" ? se : undefined,
        eligibleClubIds: parsedClubIds,
      });
      if (!meta.success) {
        return NextResponse.json(
          { error: meta.error.issues[0].message },
          { status: 400 }
        );
      }
      seasonStart = meta.data.seasonStart;
      seasonEnd = meta.data.seasonEnd;
      eligibleClubIds = meta.data.eligibleClubIds;

      if (file && file instanceof File && file.size > 0) {
        const validation = await validateImageFile(file, MAX_PATCH_IMAGE_SIZE);
        if (!validation.valid || !validation.detectedType) {
          return NextResponse.json(
            { error: validation.error ?? "Fichier invalide" },
            { status: 400 }
          );
        }
        const ext = validation.detectedType.split("/")[1] || "png";
        const newVersionDiskId = crypto.randomUUID();
        const key = `${patchId}/${newVersionDiskId}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        await uploadToR2(PATCHES_BUCKET, key, buffer, validation.detectedType);
        newImageUrl = getR2PublicUrl(PATCHES_BUCKET, key);
        oldImageKey = extractR2Key(existing.imageUrl);
      }
    } else {
      const body = await request.json();
      const meta = updateMetaSchema.safeParse(body);
      if (!meta.success) {
        return NextResponse.json(
          { error: meta.error.issues[0].message },
          { status: 400 }
        );
      }
      seasonStart = meta.data.seasonStart;
      seasonEnd = meta.data.seasonEnd;
      eligibleClubIds = meta.data.eligibleClubIds;
    }

    if (seasonStart !== undefined || seasonEnd !== undefined) {
      const effectiveStart = seasonStart ?? existing.seasonStart;
      const effectiveEnd =
        seasonEnd !== undefined ? seasonEnd : existing.seasonEnd;
      const periodValidation = validatePatchVersionPeriod(
        existing.patch.family,
        effectiveStart,
        effectiveEnd
      );
      if (!periodValidation.valid) {
        return NextResponse.json(
          { error: periodValidation.error },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.patchVersion.update({
      where: { id: versionId },
      data: {
        ...(seasonStart !== undefined && { seasonStart }),
        ...(seasonEnd !== undefined && { seasonEnd }),
        ...(eligibleClubIds !== undefined && { eligibleClubIds }),
        ...(newImageUrl !== undefined && { imageUrl: newImageUrl }),
      },
    });

    if (oldImageKey) {
      try {
        await deleteFromR2(PATCHES_BUCKET, oldImageKey);
      } catch (e) {
        console.error("R2 cleanup old image failed:", e);
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH patch version error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { error } = await requirePermission({}, true);
  if (error) return error;

  try {
    const { id: patchId, versionId } = await params;

    const existing = await prisma.patchVersion.findUnique({
      where: { id: versionId },
    });
    if (!existing || existing.patchId !== patchId) {
      return NextResponse.json({ error: "Version introuvable" }, { status: 404 });
    }

    const r2Key = extractR2Key(existing.imageUrl);
    await prisma.patchVersion.delete({ where: { id: versionId } });

    if (r2Key) {
      try {
        await deleteFromR2(PATCHES_BUCKET, r2Key);
      } catch (e) {
        console.error("R2 cleanup failed:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE patch version error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
