import { getCurrentUser } from "@/lib/get-current-user";
import {
  moderateRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  isPrivate: z.boolean(),
});

/**
 * Toggle du compte privé/public.
 * Comportement volontairement calqué sur Instagram : passer privé NE convertit PAS
 * les followers existants en FollowRequest. Seuls les NOUVEAUX follows nécessiteront
 * une approbation. Repasser en public rend le profil visible sans action supplémentaire.
 */
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(moderateRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Trop de requêtes" },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isPrivate: parsed.data.isPrivate },
  });

  return NextResponse.json({ isPrivate: parsed.data.isPrivate });
}
