import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { socialLinksSchema } from "@/lib/social-links";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const data = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        instagramHandle: true,
        twitterHandle: true,
        tiktokHandle: true,
        youtubeHandle: true,
        twitchHandle: true,
      },
    });

    return NextResponse.json(data ?? {});
  } catch (error) {
    console.error("GET /api/user/social-links error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = socialLinksSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Identifiants invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: parsed.data,
      select: {
        instagramHandle: true,
        twitterHandle: true,
        tiktokHandle: true,
        youtubeHandle: true,
        twitchHandle: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/user/social-links error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
