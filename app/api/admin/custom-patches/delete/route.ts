import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/check-permission";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

const deleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
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
    const validation = deleteSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const result = await prisma.userJerseyPatch.deleteMany({
      where: { id: { in: validation.data.ids }, patchId: null },
    });

    return NextResponse.json({ count: result.count });
  } catch (err) {
    console.error("POST admin custom patches delete error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
