import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/get-current-user";
import { checkRateLimit, getRateLimitIdentifier, moderateRateLimit, standardRateLimit } from "@/lib/rate-limit";
import {
  SHARE_JERSEYS_MAX,
  SHARE_MESSAGE_MAX,
  SHARE_THEMES,
  SHARE_TITLE_MAX,
  createShare,
  listShares,
} from "@/lib/wishlist-shares";

const CreateShareSchema = z.object({
  theme: z.enum(SHARE_THEMES),
  title: z.string().trim().min(1).max(SHARE_TITLE_MAX),
  message: z.string().max(SHARE_MESSAGE_MAX).nullish(),
  // Vide = toute la wishlist
  jerseyIds: z.array(z.string().min(1).max(64)).max(SHARE_JERSEYS_MAX).default([]),
});

const shareUrl = (request: Request, id: string) => `${process.env.NEXT_PUBLIC_URL || new URL(request.url).origin}/w/${id}`;

/** Liens de partage actifs du propriétaire. */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const identifier = await getRateLimitIdentifier(user.id);
    if (!(await checkRateLimit(standardRateLimit, identifier)).success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const shares = await listShares(user.id);
    return NextResponse.json(shares.map((s) => ({ ...s, url: shareUrl(request, s.id) })));
  } catch (error) {
    console.error("Erreur GET /api/wishlist/shares:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** Crée un lien de partage vivant /w/{id}. */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const identifier = await getRateLimitIdentifier(user.id);
    if (!(await checkRateLimit(moderateRateLimit, identifier)).success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const parsed = CreateShareSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const share = await createShare(user.id, parsed.data);
    return NextResponse.json({ ...share, url: shareUrl(request, share.id) }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/wishlist/shares:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
