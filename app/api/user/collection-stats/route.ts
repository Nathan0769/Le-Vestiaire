import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const identifier = await getRateLimitIdentifier(user.id);
    const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const collection = await prisma.userJersey.findMany({
      where: {
        userId: user.id,
      },
      include: {
        jersey: {
          include: {
            club: {
              include: {
                league: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (collection.length === 0) {
      return NextResponse.json({
        totalJerseys: 0,
        stats: null,
      });
    }

    const timelineData = collection.reduce((acc, item) => {
      const date = new Date(item.createdAt);
      const monthYear = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      acc[monthYear] = (acc[monthYear] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const timeline = Object.entries(timelineData)
      .map(([month, count]) => ({
        month,
        count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const brandStats = collection.reduce((acc, item) => {
      const brand = item.jersey.brand;
      acc[brand] = (acc[brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const brandDistribution = Object.entries(brandStats)
      .map(([brand, count]) => ({
        brand,
        count,
        percentage: Math.round((count / collection.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    const typeStats = collection.reduce((acc, item) => {
      const type = item.jersey.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeDistribution = Object.entries(typeStats)
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / collection.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    const seasonStats = collection.reduce((acc, item) => {
      const season = item.jersey.season;
      acc[season] = (acc[season] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const seasonDistribution = Object.entries(seasonStats)
      .map(([season, count]) => ({
        season,
        count,
      }))
      .sort((a, b) => b.season.localeCompare(a.season));

    const leagueStats = collection.reduce((acc, item) => {
      const league = item.jersey.club.league.name;
      const country = item.jersey.club.league.country;
      acc[league] = {
        count: (acc[league]?.count || 0) + 1,
        country,
      };
      return acc;
    }, {} as Record<string, { count: number; country: string }>);

    const leagueDistribution = Object.entries(leagueStats)
      .map(([league, data]) => ({
        league,
        country: data.country,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);

    const clubStats = collection.reduce((acc, item) => {
      const club = item.jersey.club.shortName || item.jersey.club.name;
      acc[club] = (acc[club] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const clubDistribution = Object.entries(clubStats)
      .map(([club, count]) => ({
        club,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const itemsWithPrice = collection.filter(
      (item) => item.purchasePrice && !item.isGift
    );
    const totalSpent = itemsWithPrice.reduce(
      (sum, item) => sum + Number(item.purchasePrice || 0),
      0
    );
    const averagePrice =
      itemsWithPrice.length > 0 ? totalSpent / itemsWithPrice.length : 0;

    const itemsWithRetail = collection.filter(
      (item) => item.jersey.retailPrice
    );
    const totalRetailValue = itemsWithRetail.reduce(
      (sum, item) => sum + Number(item.jersey.retailPrice || 0),
      0
    );

    const totalCollectionValue = collection.reduce((sum, item) => {
      return sum + (item.purchasePrice ? Number(item.purchasePrice) : 0);
    }, 0);

    const mostExpensive = itemsWithPrice.sort(
      (a, b) => Number(b.purchasePrice || 0) - Number(a.purchasePrice || 0)
    )[0];

    const leastExpensive = itemsWithPrice
      .filter((item) => Number(item.purchasePrice) > 0)
      .sort(
        (a, b) => Number(a.purchasePrice || 0) - Number(b.purchasePrice || 0)
      )[0];

    let spendingData: { month: string; amount: number }[] = [];

    if (itemsWithPrice.length > 0) {
      const spendingTimeline = itemsWithPrice.reduce((acc, item) => {
        const date = new Date(item.purchaseDate ?? item.createdAt);
        const monthYear = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        acc[monthYear] = (acc[monthYear] || 0) + Number(item.purchasePrice);
        return acc;
      }, {} as Record<string, number>);

      spendingData = Object.entries(spendingTimeline)
        .map(([month, amount]) => ({
          month,
          amount: Math.round(amount * 100) / 100,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
    }

    const sizeStats = collection
      .filter((item) => item.size)
      .reduce((acc, item) => {
        const size = item.size!;
        acc[size] = (acc[size] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const sizeDistribution = Object.entries(sizeStats)
      .map(([size, count]) => ({
        size,
        count,
      }))
      .sort((a, b) => {
        const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL"];
        return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
      });

    const conditionStats = collection.reduce((acc, item) => {
      const condition = item.condition;
      acc[condition] = (acc[condition] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const conditionDistribution = Object.entries(conditionStats)
      .map(([condition, count]) => ({
        condition,
        count,
        percentage: Math.round((count / collection.length) * 100),
      }))
      .sort((a, b) => {
        const conditionOrder = ["MINT", "EXCELLENT", "GOOD", "FAIR", "POOR"];
        return (
          conditionOrder.indexOf(a.condition) -
          conditionOrder.indexOf(b.condition)
        );
      });

    const giftCount = collection.filter((item) => item.isGift).length;
    const mysteryBoxCount = collection.filter(
      (item) => item.isFromMysteryBox
    ).length;
    const purchasedCount = collection.filter(
      (item) => !item.isGift && !item.isFromMysteryBox
    ).length;

    const sourceDistribution = [
      { source: "purchased", count: purchasedCount },
      { source: "gift", count: giftCount },
      { source: "mysteryBox", count: mysteryBoxCount },
    ].filter((item) => item.count > 0);

    const versionStats = collection.reduce((acc, item) => {
      const version = item.version;
      acc[version] = (acc[version] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const versionOrder = ["REPLICA", "AUTHENTIC", "STOCK_PRO", "PLAYER_ISSUE", "MATCH_WORN"];
    const versionDistribution = Object.entries(versionStats)
      .map(([version, count]) => ({
        version,
        count,
        percentage: Math.round((count / collection.length) * 100),
      }))
      .sort((a, b) => versionOrder.indexOf(a.version) - versionOrder.indexOf(b.version));

    const withTags = collection.filter((item) => item.hasTags).length;
    const withPersonalization = collection.filter(
      (item) => item.playerName || item.playerNumber
    ).length;
    const withCustomPhoto = collection.filter(
      (item) => item.userPhotoUrl
    ).length;
    const withSigned = collection.filter((item) => item.isSigned).length;
    const withAuthCertificate = collection.filter((item) => item.hasAuthCertificate).length;

    const uniqueClubs = new Set(collection.map((item) => item.jersey.club.id))
      .size;
    const uniqueLeagues = new Set(
      collection.map((item) => item.jersey.club.league.id)
    ).size;
    const uniqueCountries = new Set(
      collection.map((item) => item.jersey.club.league.country)
    ).size;

    const getAcquisitionDate = (item: typeof collection[0]) =>
      item.purchaseDate ? new Date(item.purchaseDate) : new Date(item.createdAt);

    const oldestAcquisition = collection.reduce((oldest, item) =>
      getAcquisitionDate(item) < getAcquisitionDate(oldest) ? item : oldest
    );
    const newestAcquisition = collection.reduce((newest, item) =>
      getAcquisitionDate(item) > getAcquisitionDate(newest) ? item : newest
    );

    const topSeason = seasonDistribution.length > 0
      ? [...seasonDistribution].sort((a, b) => b.count - a.count)[0]
      : null;

    const mostActiveMonth = timeline.length > 0
      ? timeline.reduce((max, item) => item.count > max.count ? item : max)
      : null;

    const allMonths = new Set(
      collection.map((item) => {
        const d = new Date(item.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      })
    );
    const sortedActiveMonths = Array.from(allMonths).sort();
    let longestStreak = sortedActiveMonths.length > 0 ? 1 : 0;
    let currentStreak = sortedActiveMonths.length > 0 ? 1 : 0;
    for (let i = 1; i < sortedActiveMonths.length; i++) {
      const [py, pm] = sortedActiveMonths[i - 1].split("-").map(Number);
      const [cy, cm] = sortedActiveMonths[i].split("-").map(Number);
      const isConsecutive =
        (cy === py && cm === pm + 1) || (cy === py + 1 && cm === 1 && pm === 12);
      if (isConsecutive) {
        currentStreak++;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
      } else {
        currentStreak = 1;
      }
    }

    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 364);
    const activityByDay = collection
      .filter((item) => new Date(item.createdAt) >= oneYearAgo)
      .reduce((acc, item) => {
        const dateStr = item.createdAt.toISOString().split("T")[0];
        acc[dateStr] = (acc[dateStr] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    const activityHeatmap = Object.entries(activityByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      totalJerseys: collection.length,
      stats: {
        timeline,
        brandDistribution,
        typeDistribution,
        seasonDistribution,
        leagueDistribution,
        clubDistribution,
        financial: {
          totalSpent: Math.round(totalSpent * 100) / 100,
          averagePrice: Math.round(averagePrice * 100) / 100,
          totalRetailValue: Math.round(totalRetailValue * 100) / 100,
          totalCollectionValue: Math.round(totalCollectionValue * 100) / 100,
          mostExpensive: mostExpensive
            ? {
                jerseyName: mostExpensive.jersey.name,
                clubName: mostExpensive.jersey.club.name,
                price: Number(mostExpensive.purchasePrice),
              }
            : null,
          leastExpensive: leastExpensive
            ? {
                jerseyName: leastExpensive.jersey.name,
                clubName: leastExpensive.jersey.club.name,
                price: Number(leastExpensive.purchasePrice),
              }
            : null,
          spendingTimeline: spendingData,
        },
        sizeDistribution,
        conditionDistribution,
        versionDistribution,
        sourceDistribution,
        additional: {
          withTags,
          withPersonalization,
          withCustomPhoto,
          withSigned,
          withAuthCertificate,
          tagsPercentage: Math.round((withTags / collection.length) * 100),
          personalizationPercentage: Math.round(
            (withPersonalization / collection.length) * 100
          ),
          customPhotoPercentage: Math.round(
            (withCustomPhoto / collection.length) * 100
          ),
          signedPercentage: Math.round((withSigned / collection.length) * 100),
          authCertificatePercentage: Math.round((withAuthCertificate / collection.length) * 100),
        },
        diversity: {
          uniqueClubs,
          uniqueLeagues,
          uniqueCountries,
        },
        records: {
          oldestAcquisition: {
            jerseyName: oldestAcquisition.jersey.name,
            clubName: oldestAcquisition.jersey.club.name,
            date: oldestAcquisition.purchaseDate ?? oldestAcquisition.createdAt,
          },
          newestAcquisition: {
            jerseyName: newestAcquisition.jersey.name,
            clubName: newestAcquisition.jersey.club.name,
            date: newestAcquisition.purchaseDate ?? newestAcquisition.createdAt,
          },
          topClub: clubDistribution[0] || null,
          topLeague: leagueDistribution[0] || null,
          topBrand: brandDistribution[0] || null,
          topSeason,
          mostActiveMonth,
          longestStreak,
        },
        activityHeatmap,
      },
    });
  } catch (error) {
    console.error("Error fetching collection stats:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
