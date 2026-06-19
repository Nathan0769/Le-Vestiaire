import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { validateImageFile } from "@/lib/file-validation";
import { uploadToR2, getR2PublicUrl, PATCHES_BUCKET } from "@/lib/r2-storage";
import { validatePatchVersionPeriod } from "@/lib/patches/season-format";
import crypto from "crypto";

const MAX_PATCH_IMAGE_SIZE = 2 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission({}, true);
  if (error) return error;

  try {
    const { id: patchId } = await params;

    const patch = await prisma.patch.findUnique({ where: { id: patchId } });
    if (!patch) {
      return NextResponse.json({ error: "Patch introuvable" }, { status: 404 });
    }

    const formData = await request.formData();
    const seasonStartRaw = formData.get("seasonStart");
    const seasonEndRaw = formData.get("seasonEnd");
    const file = formData.get("file");

    if (typeof seasonStartRaw !== "string" || seasonStartRaw.length === 0) {
      return NextResponse.json(
        { error: "seasonStart requis" },
        { status: 400 }
      );
    }

    const seasonStart = seasonStartRaw;
    const seasonEnd =
      typeof seasonEndRaw === "string" && seasonEndRaw.length > 0
        ? seasonEndRaw
        : null;

    const periodValidation = validatePatchVersionPeriod(
      patch.family,
      seasonStart,
      seasonEnd
    );
    if (!periodValidation.valid) {
      return NextResponse.json(
        { error: periodValidation.error },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null;

    if (file && file instanceof File && file.size > 0) {
      const fileValidation = await validateImageFile(file, MAX_PATCH_IMAGE_SIZE);
      if (!fileValidation.valid || !fileValidation.detectedType) {
        return NextResponse.json(
          { error: fileValidation.error ?? "Fichier invalide" },
          { status: 400 }
        );
      }

      const ext = fileValidation.detectedType.split("/")[1] || "png";
      const versionId = crypto.randomUUID();
      const key = `${patchId}/${versionId}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      await uploadToR2(PATCHES_BUCKET, key, buffer, fileValidation.detectedType);
      imageUrl = getR2PublicUrl(PATCHES_BUCKET, key);
    }

    const version = await prisma.patchVersion.create({
      data: {
        patchId,
        seasonStart,
        seasonEnd,
        imageUrl,
      },
    });

    return NextResponse.json(version, { status: 201 });
  } catch (err) {
    console.error("POST patch version error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
