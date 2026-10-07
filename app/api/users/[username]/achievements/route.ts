import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { isBlocked } from "@/lib/follow";
import {
  effectiveTier,
  isKnownAchievementKey,
} from "@/lib/achievements/definitions";
import { getRarityMap } from "@/lib/achievements/rarity";
import { resolveAchievementText } from "@/lib/achievements/resolve-text";

/**
 * Succès débloqués d'un utilisateur (lecture seule, consommé par l'app mobile
 * pour la page succès d'un profil public). Pas de progression (inProgress) :
 * on n'expose que les succès obtenus. Masqué si profil anonyme.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(currentUser.id);
  const rateLimit = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { username: raw } = await params;
  const username = raw.toLowerCase();

  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true, leaderboardAnonymous: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const isSelf = target.id === currentUser.id;
  if (!isSelf && (await isBlocked(currentUser.id, target.id))) {
    return NextResponse.json({ error: "Accès bloqué" }, { status: 403 });
  }

  if (target.leaderboardAnonymous) {
    return NextResponse.json({ unlocked: [], rarity: {} });
  }

  const [rows, rarity] = await Promise.all([
    prisma.achievement.findMany({
      where: { userId: target.id },
      orderBy: { unlockedAt: "desc" },
      select: { id: true, key: true, category: true, tier: true, unlockedAt: true, metadata: true },
    }),
    getRarityMap(),
  ]);

  const unlocked = rows
    .filter((a) => isKnownAchievementKey(a.key))
    .map((a) => {
      const text = resolveAchievementText(
        a.key,
        a.metadata as Record<string, unknown> | null,
      );
      return {
        id: a.id,
        key: a.key,
        category: a.category,
        tier: effectiveTier(a.key, a.tier),
        unlockedAt: a.unlockedAt.toISOString(),
        metadata: a.metadata,
        title: text.title,
        description: text.description,
        howTo: text.howTo,
        imageUrl: text.badgeUrl,
      };
    });

  return NextResponse.json({ unlocked, rarity });
}
