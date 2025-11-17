import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@supabase/supabase-js";
import type {
  LeaderboardCategory,
  LeaderboardPeriod,
  LeaderboardEntry,
} from "@/types/leaderboard";
import {
  generousRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Rate limiting : 60 requêtes par minute (généreux car endpoint public)
    const currentUser = await getCurrentUser();
    const identifier = await getRateLimitIdentifier(currentUser?.id);
    const rateLimitResult = await checkRateLimit(generousRateLimit, identifier);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many leaderboard requests. Please wait.",
          remaining: rateLimitResult.remaining,
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") ||
      "all_time") as LeaderboardPeriod;
    const category = (searchParams.get("category") ||
      "collection_size") as LeaderboardCategory;

    let entries: LeaderboardEntry[] = [];

    // Calculer selon la catégorie
    switch (category) {
      case "collection_size":
        entries = await getCollectionSizeLeaderboard(period);
        break;
      case "collection_diversity":
        entries = await getCollectionDiversityLeaderboard();
        break;
      case "league_diversity":
        entries = await getLeagueDiversityLeaderboard();
        break;
      case "vintage_specialist":
        entries = await getVintageSpecialistLeaderboard();
        break;
    }

    let currentUserRank: number | undefined;
    if (currentUser) {
      const userIndex = entries.findIndex((e) => e.userId === currentUser.id);
      currentUserRank = userIndex >= 0 ? userIndex + 1 : undefined;
    }

    return NextResponse.json({
      period,
      category,
      entries,
      currentUserRank,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function getCollectionSizeLeaderboard(
  period: LeaderboardPeriod
): Promise<LeaderboardEntry[]> {
  const startOfMonth =
    period === "month"
      ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      : null;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      leaderboardAnonymous: true,
      favoriteClub: {
        select: { id: true, name: true },
      },
      collection: {
        where: startOfMonth
          ? {
              createdAt: { gte: startOfMonth },
            }
          : undefined,
        select: {
          purchasePrice: true,
        },
      },
    },
  });

  const leaderboard = users
    .map((user) => {
      const isAnonymous = user.leaderboardAnonymous;
      return {
        userId: user.id,
        username: isAnonymous
          ? `Collector #${user.id.slice(-4).toUpperCase()}`
          : user.username ?? `User #${user.id.slice(-4).toUpperCase()}`,
        name: isAnonymous ? "Anonymous" : user.name,
        avatar: isAnonymous ? null : user.avatar,
        favoriteClub: isAnonymous ? null : user.favoriteClub,
        score: user.collection.length,
        metadata: {
          totalValue: user.collection.reduce(
            (sum, item) =>
              sum + (item.purchasePrice ? Number(item.purchasePrice) : 0),
            0
          ),
        },
        isAnonymous,
      };
    })
    .filter((u) => u.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  const withAvatars = await Promise.all(
    leaderboard.map(async (entry, index) => {
      let avatarUrl = null;
      if (entry.avatar && !entry.isAnonymous) {
        const { data } = await supabaseAdmin.storage
          .from("avatar")
          .createSignedUrl(entry.avatar, 60 * 60);
        avatarUrl = data?.signedUrl || null;
      }

      return {
        ...entry,
        rank: index + 1,
        avatarUrl,
        hasBadge: index < 3,
      };
    })
  );

  return withAvatars;
}

async function getCollectionDiversityLeaderboard(): Promise<
  LeaderboardEntry[]
> {
  const result = await prisma.$queryRaw<
    Array<{
      user_id: string;
      unique_clubs: bigint;
    }>
  >`
    SELECT 
      uj."userId" as user_id,
      COUNT(DISTINCT j."clubId") as unique_clubs
    FROM user_jerseys uj
    JOIN jerseys j ON uj."jerseyId" = j.id
    GROUP BY uj."userId"
    HAVING COUNT(DISTINCT j."clubId") > 0
    ORDER BY unique_clubs DESC
    LIMIT 50
  `;

  const userIds = result.map((r) => r.user_id);

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      leaderboardAnonymous: true,
      favoriteClub: {
        select: { id: true, name: true },
      },
    },
  });

  const leaderboard = result.map((r) => {
    const user = users.find((u) => u.id === r.user_id)!;
    const isAnonymous = user.leaderboardAnonymous;

    return {
      userId: user.id,
      username: isAnonymous
        ? `Collector #${user.id.slice(-4).toUpperCase()}`
        : user.username ?? `User #${user.id.slice(-4).toUpperCase()}`,
      name: isAnonymous ? "Anonymous" : user.name,
      avatar: isAnonymous ? null : user.avatar,
      favoriteClub: isAnonymous ? null : user.favoriteClub,
      score: Number(r.unique_clubs),
      metadata: {
        uniqueClubs: Number(r.unique_clubs),
      },
      isAnonymous,
    };
  });

  const withAvatars = await Promise.all(
    leaderboard.map(async (entry, index) => {
      let avatarUrl = null;
      if (entry.avatar && !entry.isAnonymous) {
        const { data } = await supabaseAdmin.storage
          .from("avatar")
          .createSignedUrl(entry.avatar, 60 * 60);
        avatarUrl = data?.signedUrl || null;
      }

      return {
        ...entry,
        rank: index + 1,
        avatarUrl,
        hasBadge: index < 3,
      };
    })
  );

  return withAvatars;
}

async function getLeagueDiversityLeaderboard(): Promise<LeaderboardEntry[]> {
  const result = await prisma.$queryRaw<
    Array<{
      user_id: string;
      unique_leagues: bigint;
    }>
  >`
    SELECT 
      uj."userId" as user_id,
      COUNT(DISTINCT c."leagueId") as unique_leagues
    FROM user_jerseys uj
    JOIN jerseys j ON uj."jerseyId" = j.id
    JOIN clubs c ON j."clubId" = c.id
    GROUP BY uj."userId"
    HAVING COUNT(DISTINCT c."leagueId") > 0
    ORDER BY unique_leagues DESC
    LIMIT 50
  `;

  const userIds = result.map((r) => r.user_id);

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      leaderboardAnonymous: true,
      favoriteClub: {
        select: { id: true, name: true },
      },
    },
  });

  const leaderboard = result.map((r) => {
    const user = users.find((u) => u.id === r.user_id)!;
    const isAnonymous = user.leaderboardAnonymous;

    return {
      userId: user.id,
      username: isAnonymous
        ? `Collector #${user.id.slice(-4).toUpperCase()}`
        : user.username ?? `User #${user.id.slice(-4).toUpperCase()}`,
      name: isAnonymous ? "Anonymous" : user.name,
      avatar: isAnonymous ? null : user.avatar,
      favoriteClub: isAnonymous ? null : user.favoriteClub,
      score: Number(r.unique_leagues),
      metadata: {
        uniqueLeagues: Number(r.unique_leagues),
      },
      isAnonymous,
    };
  });

  const withAvatars = await Promise.all(
    leaderboard.map(async (entry, index) => {
      let avatarUrl = null;
      if (entry.avatar && !entry.isAnonymous) {
        const { data } = await supabaseAdmin.storage
          .from("avatar")
          .createSignedUrl(entry.avatar, 60 * 60);
        avatarUrl = data?.signedUrl || null;
      }

      return {
        ...entry,
        rank: index + 1,
        avatarUrl,
        hasBadge: index < 3,
      };
    })
  );

  return withAvatars;
}

async function getVintageSpecialistLeaderboard(): Promise<LeaderboardEntry[]> {
  const result = await prisma.$queryRaw<
    Array<{
      user_id: string;
      vintage_count: bigint;
    }>
  >`
    SELECT 
      uj."userId" as user_id,
      COUNT(*) as vintage_count
    FROM user_jerseys uj
    JOIN jerseys j ON uj."jerseyId" = j.id
    WHERE CAST(SUBSTRING(j.season, 1, 4) AS INTEGER) < 2005
    GROUP BY uj."userId"
    HAVING COUNT(*) > 0
    ORDER BY vintage_count DESC
    LIMIT 50
  `;

  const userIds = result.map((r) => r.user_id);

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      leaderboardAnonymous: true,
      favoriteClub: {
        select: { id: true, name: true },
      },
    },
  });

  const leaderboard = result.map((r) => {
    const user = users.find((u) => u.id === r.user_id)!;
    const isAnonymous = user.leaderboardAnonymous;

    return {
      userId: user.id,
      username: isAnonymous
        ? `Collector #${user.id.slice(-4).toUpperCase()}`
        : user.username ?? `User #${user.id.slice(-4).toUpperCase()}`,
      name: isAnonymous ? "Anonymous" : user.name,
      avatar: isAnonymous ? null : user.avatar,
      favoriteClub: isAnonymous ? null : user.favoriteClub,
      score: Number(r.vintage_count),
      metadata: {
        vintageCount: Number(r.vintage_count),
      },
      isAnonymous,
    };
  });

  const withAvatars = await Promise.all(
    leaderboard.map(async (entry, index) => {
      let avatarUrl = null;
      if (entry.avatar && !entry.isAnonymous) {
        const { data } = await supabaseAdmin.storage
          .from("avatar")
          .createSignedUrl(entry.avatar, 60 * 60);
        avatarUrl = data?.signedUrl || null;
      }

      return {
        ...entry,
        rank: index + 1,
        avatarUrl,
        hasBadge: index < 3,
      };
    })
  );

  return withAvatars;
}
