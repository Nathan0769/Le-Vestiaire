import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import { isSupporter } from "@/lib/subscription";
import { isValidFrame, isValidBanner } from "@/lib/cosmetics";
import {
  socialActionRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";

const bodySchema = z.object({
  avatarFrame: z.string().nullable().optional(),
  profileBanner: z.string().nullable().optional(),
});

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(
      socialActionRateLimit,
      identifier
    );
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });
    if (!isSupporter(dbUser)) {
      return NextResponse.json(
        { error: "Réservé aux membres Supporter" },
        { status: 403 }
      );
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const data: { avatarFrame?: string | null; profileBanner?: string | null } =
      {};

    if ("avatarFrame" in parsed.data) {
      const frame = parsed.data.avatarFrame;
      if (frame !== null && frame !== undefined && !isValidFrame(frame)) {
        return NextResponse.json(
          { error: "Contour invalide" },
          { status: 400 }
        );
      }
      if (frame !== undefined) data.avatarFrame = frame;
    }

    if ("profileBanner" in parsed.data) {
      const banner = parsed.data.profileBanner;
      if (banner !== null && banner !== undefined && !isValidBanner(banner)) {
        return NextResponse.json(
          { error: "Bannière invalide" },
          { status: 400 }
        );
      }
      if (banner !== undefined) data.profileBanner = banner;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: { avatarFrame: true, profileBanner: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Cosmetics Error]", {
      error: error instanceof Error ? error.message : error,
    });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
