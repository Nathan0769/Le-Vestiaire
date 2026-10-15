import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/check-permission";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

// 50 caractères : même limite que la saisie côté utilisateur.
const renameSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  label: z
    .string()
    .trim()
    .min(1, "Le libellé est requis")
    .max(50, "Le libellé ne peut pas dépasser 50 caractères"),
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
    const validation = renameSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }
    const { ids, label } = validation.data;

    const result = await prisma.userJerseyPatch.updateMany({
      where: { id: { in: ids }, patchId: null },
      data: { customLabel: label },
    });

    return NextResponse.json({ count: result.count });
  } catch (err) {
    console.error("POST admin custom patches rename error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
