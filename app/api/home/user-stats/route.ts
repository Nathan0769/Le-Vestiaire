import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté" },
        { status: 401 }
      );
    }

    // Récupérer les stats de la collection
    const [collectionCount, wishlistCount, collectionItems, wishlistItems] =
      await Promise.all([
        // Nombre total de maillots en collection
        prisma.userJersey.count({
          where: { userId: user.id },
        }),

        // Nombre total de maillots en wishlist
        prisma.wishlist.count({
          where: { userId: user.id },
        }),

        // Quelques maillots de la collection pour aperçu
        prisma.userJersey.findMany({
          where: { userId: user.id },
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
          orderBy: { createdAt: "desc" },
          take: 3,
        }),

        // Quelques maillots de la wishlist pour aperçu
        prisma.wishlist.findMany({
          where: { userId: user.id },
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
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
      ]);

    // Calculer la valeur totale de la collection (si prix d'achat disponible)
    const totalValue = await prisma.userJersey.aggregate({
      where: {
        userId: user.id,
        purchasePrice: { not: null },
      },
      _sum: {
        purchasePrice: true,
      },
    });

    // Stats par ligue dans la collection
    const leagueStats = await prisma.userJersey.groupBy({
      by: ["jerseyId"],
      where: { userId: user.id },
      _count: true,
    });

    // Récupérer les infos des ligues pour les stats
    const jerseyIds = leagueStats.map((stat) => stat.jerseyId);
    const jerseysWithLeagues = await prisma.jersey.findMany({
      where: { id: { in: jerseyIds } },
      include: {
        club: {
          include: {
            league: true,
          },
        },
      },
    });

    // Regrouper par ligue
    const leagueCount = jerseysWithLeagues.reduce((acc, jersey) => {
      const leagueName = jersey.club.league.name;
      acc[leagueName] = (acc[leagueName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const response = {
      collection: {
        total: collectionCount,
        totalValue: totalValue._sum.purchasePrice
          ? Number(totalValue._sum.purchasePrice)
          : null,
        recentItems: collectionItems.map((item) => ({
          id: item.id,
          jersey: {
            id: item.jersey.id,
            name: item.jersey.name,
            imageUrl: item.jersey.imageUrl,
            type: item.jersey.type,
            club: item.jersey.club,
          },
          purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
          createdAt: item.createdAt,
        })),
        leagueStats: leagueCount,
      },
      wishlist: {
        total: wishlistCount,
        recentItems: wishlistItems.map((item) => ({
          id: item.id,
          jersey: {
            id: item.jersey.id,
            name: item.jersey.name,
            imageUrl: item.jersey.imageUrl,
            type: item.jersey.type,
            club: item.jersey.club,
          },
          createdAt: item.createdAt,
        })),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur API user stats:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
