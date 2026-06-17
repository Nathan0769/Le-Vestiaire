import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/check-permission";
import prisma from "@/lib/prisma";
import { validateImageFile } from "@/lib/file-validation";
import { uploadToR2, getR2PublicUrl, PATCHES_BUCKET } from "@/lib/r2-storage";
import crypto from "crypto";

const seasonRegex = /^\d{4}-\d{2}$/;

const createVersionMetaSchema = z.object({
  seasonStart: z.string().regex(seasonRegex, "Format de saison invalide (YYYY-YY)"),
  seasonEnd: z
    .string()
    .regex(seasonRegex, "Format de saison invalide (YYYY-YY)")
    .optional()
    .nullable(),
});

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
    const seasonStart = formData.get("seasonStart");
    const seasonEnd = formData.get("seasonEnd");
    const file = formData.get("file");

    const validation = createVersionMetaSchema.safeParse({
      seasonStart,
      seasonEnd: seasonEnd === null || seasonEnd === "" ? null : seasonEnd,
    });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
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
        seasonStart: validation.data.seasonStart,
        seasonEnd: validation.data.seasonEnd ?? null,
        imageUrl,
      },
    });

    return NextResponse.json(version, { status: 201 });
  } catch (err) {
    console.error("POST patch version error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
