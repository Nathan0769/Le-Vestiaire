import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isBlocked } from "@/lib/follow";
import { isSupporter } from "@/lib/subscription";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";

/**
 * Profil public d'un utilisateur par username (consommé par l'app mobile).
 * Auth requise. Blocage réciproque -> 403. `isPrivate` ne gate pas le contenu
 * (modèle browse-first) mais informe l'état du bouton suivre côté client.
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
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { username: raw } = await params;
  const username = raw.toLowerCase();

  const target = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      image: true,
      bio: true,
      plan: true,
      avatarFrame: true,
      isPrivate: true,
      leaderboardAnonymous: true,
      createdAt: true,
      favoriteClub: { select: { id: true, name: true } },
      instagramHandle: true,
      twitterHandle: true,
      tiktokHandle: true,
      youtubeHandle: true,
      twitchHandle: true,
      _count: { select: { collection: true, wishlist: true } },
    },
  });

  if (!target) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const isSelf = target.id === currentUser.id;

  if (!isSelf && (await isBlocked(currentUser.id, target.id))) {
    return NextResponse.json({ error: "Accès bloqué" }, { status: 403 });
  }

  const [followersCount, followingCount, follow, followRequest] =
    await Promise.all([
      prisma.follow.count({ where: { followingId: target.id } }),
      prisma.follow.count({ where: { followerId: target.id } }),
      isSelf
        ? Promise.resolve(null)
        : prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUser.id,
                followingId: target.id,
              },
            },
            select: { id: true },
          }),
      isSelf
        ? Promise.resolve(null)
        : prisma.followRequest.findUnique({
            where: {
              requesterId_targetId: {
                requesterId: currentUser.id,
                targetId: target.id,
              },
            },
            select: { id: true },
          }),
    ]);

  let followState: "none" | "following" | "requested" | "self" = "none";
  if (isSelf) followState = "self";
  else if (follow) followState = "following";
  else if (followRequest) followState = "requested";

  const isAnonymous = target.leaderboardAnonymous ?? false;

  let avatarUrl: string | null = null;
  if (!isAnonymous && target.avatar) {
    avatarUrl = await getR2PresignedUrl(AVATARS_BUCKET, target.avatar, 60 * 60);
  }

  return NextResponse.json({
    id: target.id,
    username: target.username,
    name: isAnonymous ? "Utilisateur" : target.username ?? target.name,
    avatarUrl: avatarUrl ?? (isAnonymous ? null : target.image),
    bio: isAnonymous ? null : target.bio,
    isPrivate: target.isPrivate,
    isAnonymous,
    isSupporter: !isAnonymous && isSupporter(target),
    avatarFrame: isAnonymous ? null : target.avatarFrame,
    favoriteClub: isAnonymous ? null : target.favoriteClub,
    socialLinks: isAnonymous
      ? null
      : {
          instagram: target.instagramHandle,
          twitter: target.twitterHandle,
          tiktok: target.tiktokHandle,
          youtube: target.youtubeHandle,
          twitch: target.twitchHandle,
        },
    stats: {
      collectionCount: target._count.collection,
      wishlistCount: target._count.wishlist,
      followersCount,
      followingCount,
    },
    followState,
    isSelf,
    createdAt: target.createdAt.toISOString(),
  });
}
