import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";
import { getBlockedIdsBothWays } from "@/lib/follow";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Trop de recherches. Ralentissez un peu.",
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const blockedIds = await getBlockedIdsBothWays(user.id);

    const foundUsers = await prisma.user.findMany({
      where: {
        AND: [
          { username: { contains: query, mode: "insensitive" } },
          { id: { not: user.id } },
          { leaderboardAnonymous: { not: true } },
          ...(blockedIds.length > 0 ? [{ id: { notIn: blockedIds } }] : []),
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        isPrivate: true,
        favoriteClub: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 10,
      orderBy: { username: "asc" },
    });

    const usersEnriched = await Promise.all(
      foundUsers.map(async (foundUser) => {
        const [follow, followRequest] = await Promise.all([
          prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: user.id,
                followingId: foundUser.id,
              },
            },
            select: { id: true },
          }),
          prisma.followRequest.findUnique({
            where: {
              requesterId_targetId: {
                requesterId: user.id,
                targetId: foundUser.id,
              },
            },
            select: { id: true },
          }),
        ]);

        let followState: "none" | "following" | "requested" = "none";
        if (follow) followState = "following";
        else if (followRequest) followState = "requested";

        let avatarUrl: string | null = null;
        if (foundUser.avatar) {
          avatarUrl = await getR2PresignedUrl(
            AVATARS_BUCKET,
            foundUser.avatar,
            60 * 60
          );
        }

        return {
          id: foundUser.id,
          username: foundUser.username,
          name: foundUser.username,
          avatar: foundUser.avatar,
          avatarUrl,
          bio: foundUser.bio,
          isPrivate: foundUser.isPrivate,
          favoriteClub: foundUser.favoriteClub || undefined,
          followState,
        };
      })
    );

    return NextResponse.json({ users: usersEnriched });
  } catch (error) {
    console.error("Erreur search users:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
