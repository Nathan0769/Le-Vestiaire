// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seed...");

  // 1. Créer les ligues
  const leagues = await Promise.all([
    prisma.league.upsert({
      where: { id: "ligue-1" },
      update: {},
      create: {
        id: "ligue-1",
        name: "Ligue 1",
        country: "France",
        logoUrl:
          "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.lfp.fr%2Farticle%2Fun-nouveau-logo-pour-la-ligue-1-a-compter-de-2024-2025&psig=AOvVaw1rXUQb6DUPmIlDsn8WLVLD&ust=1752504933477000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCJiCheOLuo4DFQAAAAAdAAAAABAU",
        tier: 1,
      },
    }),
    prisma.league.upsert({
      where: { id: "premier-league" },
      update: {},
      create: {
        id: "premier-league",
        name: "Premier League",
        country: "Angleterre",
        logoUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Premier_League_Logo.svg/200px-Premier_League_Logo.svg.png",
        tier: 1,
      },
    }),
    prisma.league.upsert({
      where: { id: "serie-a" },
      update: {},
      create: {
        id: "serie-a",
        name: "Serie A",
        country: "Italie",
        logoUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Serie_A_logo_2022.svg/200px-Serie_A_logo_2022.svg.png",
        tier: 1,
      },
    }),
    prisma.league.upsert({
      where: { id: "la-liga" },
      update: {},
      create: {
        id: "la-liga",
        name: "La Liga",
        country: "Espagne",
        logoUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/LaLiga_EA_Sports_2023_Vertical_Logo.svg/200px-LaLiga_EA_Sports_2023_Vertical_Logo.svg.png",
        tier: 1,
      },
    }),
    prisma.league.upsert({
      where: { id: "bundesliga" },
      update: {},
      create: {
        id: "bundesliga",
        name: "Bundesliga",
        country: "Allemagne",
        logoUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Bundesliga_logo_%282017%29.svg/200px-Bundesliga_logo_%282017%29.svg.png",
        tier: 1,
      },
    }),
  ]);

  console.log("✅ Ligues créées");

  // 2. Créer les clubs
  const clubs = await Promise.all([
    // Ligue 1
    prisma.club.upsert({
      where: { id: "psg" },
      update: {},
      create: {
        id: "psg",
        name: "Paris Saint-Germain",
        shortName: "PSG",
        leagueId: "ligue-1",
        logoUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Paris_Saint-Germain_Logo.svg/200px-Paris_Saint-Germain_Logo.svg.png",
        primaryColor: "#004170",
      },
    }),
    prisma.club.upsert({
      where: { id: "marseille" },
      update: {},
      create: {
        id: "marseille",
        name: "Olympique de Marseille",
        shortName: "OM",
        leagueId: "ligue-1",
        logoUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Olympique_Marseille_logo.svg/200px-Olympique_Marseille_logo.svg.png",
        primaryColor: "#009ADA",
      },
    }),
    prisma.club.upsert({
      where: { id: "lyon" },
      update: {},
      create: {
        id: "lyon",
        name: "Olympique Lyonnais",
        shortName: "OL",
        leagueId: "ligue-1",
        logoUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Olympique_Lyonnais_logo.svg/200px-Olympique_Lyonnais_logo.svg.png",
        primaryColor: "#1E4A8C",
      },
    }),

    // Premier League
    prisma.club.upsert({
      where: { id: "manchester-united" },
      update: {},
      create: {
        id: "manchester-united",
        name: "Manchester United",
        shortName: "Man United",
        leagueId: "premier-league",
        logoUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Manchester_United_FC_crest.svg/200px-Manchester_United_FC_crest.svg.png",
        primaryColor: "#DA020E",
      },
    }),
    prisma.club.upsert({
      where: { id: "liverpool" },
      update: {},
      create: {
        id: "liverpool",
        name: "Liverpool FC",
        shortName: "Liverpool",
        leagueId: "premier-league",
        logoUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Liverpool_FC.svg/200px-Liverpool_FC.svg.png",
        primaryColor: "#C8102E",
      },
    }),
    prisma.club.upsert({
      where: { id: "chelsea" },
      update: {},
      create: {
        id: "chelsea",
        name: "Chelsea FC",
        shortName: "Chelsea",
        leagueId: "premier-league",
        logoUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Chelsea_FC.svg/200px-Chelsea_FC.svg.png",
        primaryColor: "#034694",
      },
    }),

    // Serie A
    prisma.club.upsert({
      where: { id: "juventus" },
      update: {},
      create: {
        id: "juventus",
        name: "Juventus",
        shortName: "Juve",
        leagueId: "serie-a",
        logoUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Juventus_FC_logo.svg/200px-Juventus_FC_logo.svg.png",
        primaryColor: "#000000",
      },
    }),
    prisma.club.upsert({
      where: { id: "ac-milan" },
      update: {},
      create: {
        id: "ac-milan",
        name: "AC Milan",
        shortName: "Milan",
        leagueId: "serie-a",
        logoUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_of_AC_Milan.svg/200px-Logo_of_AC_Milan.svg.png",
        primaryColor: "#FB090B",
      },
    }),

    // La Liga
    prisma.club.upsert({
      where: { id: "real-madrid" },
      update: {},
      create: {
        id: "real-madrid",
        name: "Real Madrid",
        shortName: "Real",
        leagueId: "la-liga",
        logoUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Real_Madrid_CF.svg/200px-Real_Madrid_CF.svg.png",
        primaryColor: "#FFFFFF",
      },
    }),
    prisma.club.upsert({
      where: { id: "barcelona" },
      update: {},
      create: {
        id: "barcelona",
        name: "FC Barcelona",
        shortName: "Barça",
        leagueId: "la-liga",
        logoUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/FC_Barcelona_%28crest%29.svg/200px-FC_Barcelona_%28crest%29.svg.png",
        primaryColor: "#A50044",
      },
    }),

    // Bundesliga
    prisma.club.upsert({
      where: { id: "bayern-munich" },
      update: {},
      create: {
        id: "bayern-munich",
        name: "Bayern Munich",
        shortName: "Bayern",
        leagueId: "bundesliga",
        logoUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/200px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png",
        primaryColor: "#DC052D",
      },
    }),
    prisma.club.upsert({
      where: { id: "borussia-dortmund" },
      update: {},
      create: {
        id: "borussia-dortmund",
        name: "Borussia Dortmund",
        shortName: "BVB",
        leagueId: "bundesliga",
        logoUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/200px-Borussia_Dortmund_logo.svg.png",
        primaryColor: "#FDE100",
      },
    }),
  ]);

  console.log("✅ Clubs créés");

  // 3. Créer les maillots
  const jerseys = await Promise.all([
    // PSG
    prisma.jersey.upsert({
      where: {
        clubId_season_type: { clubId: "psg", season: "2023-24", type: "HOME" },
      },
      update: {},
      create: {
        name: "Maillot Domicile PSG 2023-24",
        clubId: "psg",
        season: "2023-24",
        type: "HOME",
        brand: "Nike",
        imageUrl:
          "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/ec6e6b3a-9a0e-4e7a-9b7c-6d5e5f8c2c5d/maillot-de-football-paris-saint-germain-2023-24-stadium-domicile-pour-homme-9BfvD6.png",
        retailPrice: 89.99,
      },
    }),
    prisma.jersey.upsert({
      where: {
        clubId_season_type: { clubId: "psg", season: "2023-24", type: "AWAY" },
      },
      update: {},
      create: {
        name: "Maillot Extérieur PSG 2023-24",
        clubId: "psg",
        season: "2023-24",
        type: "AWAY",
        brand: "Nike",
        imageUrl:
          "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/8c4f1a3b-9d2e-4e8b-9c7d-6e5f6g8h2i5j/maillot-de-football-paris-saint-germain-2023-24-stadium-exterieur-pour-homme-3MfkR8.png",
        retailPrice: 89.99,
      },
    }),
    prisma.jersey.upsert({
      where: {
        clubId_season_type: { clubId: "psg", season: "2022-23", type: "HOME" },
      },
      update: {},
      create: {
        name: "Maillot Domicile PSG 2022-23",
        clubId: "psg",
        season: "2022-23",
        type: "HOME",
        brand: "Nike",
        imageUrl:
          "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/1d4c1a2b-8e3f-4g5h-9i6j-7k8l9m0n1o2p/maillot-de-football-paris-saint-germain-2022-23-stadium-domicile-pour-homme-5BgkL3.png",
        retailPrice: 84.99,
      },
    }),

    // Manchester United
    prisma.jersey.upsert({
      where: {
        clubId_season_type: {
          clubId: "manchester-united",
          season: "2023-24",
          type: "HOME",
        },
      },
      update: {},
      create: {
        name: "Maillot Domicile Manchester United 2023-24",
        clubId: "manchester-united",
        season: "2023-24",
        type: "HOME",
        brand: "Adidas",
        imageUrl:
          "https://assets.adidas.com/images/w_600,f_auto,q_auto/3b8f2d1e4c5a6789/manchester-united-23-24-home-jersey-red.jpg",
        retailPrice: 89.95,
      },
    }),
    prisma.jersey.upsert({
      where: {
        clubId_season_type: {
          clubId: "manchester-united",
          season: "2023-24",
          type: "AWAY",
        },
      },
      update: {},
      create: {
        name: "Maillot Extérieur Manchester United 2023-24",
        clubId: "manchester-united",
        season: "2023-24",
        type: "AWAY",
        brand: "Adidas",
        imageUrl:
          "https://assets.adidas.com/images/w_600,f_auto,q_auto/9c7e4f2a1b8d5963/manchester-united-23-24-away-jersey-white.jpg",
        retailPrice: 89.95,
      },
    }),

    // Real Madrid
    prisma.jersey.upsert({
      where: {
        clubId_season_type: {
          clubId: "real-madrid",
          season: "2023-24",
          type: "HOME",
        },
      },
      update: {},
      create: {
        name: "Maillot Domicile Real Madrid 2023-24",
        clubId: "real-madrid",
        season: "2023-24",
        type: "HOME",
        brand: "Adidas",
        imageUrl:
          "https://assets.adidas.com/images/w_600,f_auto,q_auto/a1b2c3d4e5f67890/real-madrid-23-24-home-jersey-white.jpg",
        retailPrice: 89.95,
      },
    }),
    prisma.jersey.upsert({
      where: {
        clubId_season_type: {
          clubId: "real-madrid",
          season: "2023-24",
          type: "AWAY",
        },
      },
      update: {},
      create: {
        name: "Maillot Extérieur Real Madrid 2023-24",
        clubId: "real-madrid",
        season: "2023-24",
        type: "AWAY",
        brand: "Adidas",
        imageUrl:
          "https://assets.adidas.com/images/w_600,f_auto,q_auto/f9e8d7c6b5a43210/real-madrid-23-24-away-jersey-black.jpg",
        retailPrice: 89.95,
      },
    }),

    // Barcelona
    prisma.jersey.upsert({
      where: {
        clubId_season_type: {
          clubId: "barcelona",
          season: "2023-24",
          type: "HOME",
        },
      },
      update: {},
      create: {
        name: "Maillot Domicile FC Barcelona 2023-24",
        clubId: "barcelona",
        season: "2023-24",
        type: "HOME",
        brand: "Nike",
        imageUrl:
          "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/5a4b3c2d1e9f8765/fc-barcelona-23-24-stadium-home-jersey-blue.png",
        retailPrice: 89.99,
      },
    }),

    // Liverpool
    prisma.jersey.upsert({
      where: {
        clubId_season_type: {
          clubId: "liverpool",
          season: "2023-24",
          type: "HOME",
        },
      },
      update: {},
      create: {
        name: "Maillot Domicile Liverpool 2023-24",
        clubId: "liverpool",
        season: "2023-24",
        type: "HOME",
        brand: "Nike",
        imageUrl:
          "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/8b7a6c5d4e3f2109/liverpool-fc-23-24-stadium-home-jersey-red.png",
        retailPrice: 89.99,
      },
    }),

    // Bayern Munich
    prisma.jersey.upsert({
      where: {
        clubId_season_type: {
          clubId: "bayern-munich",
          season: "2023-24",
          type: "HOME",
        },
      },
      update: {},
      create: {
        name: "Maillot Domicile Bayern Munich 2023-24",
        clubId: "bayern-munich",
        season: "2023-24",
        type: "HOME",
        brand: "Adidas",
        imageUrl:
          "https://assets.adidas.com/images/w_600,f_auto,q_auto/1f2e3d4c5b6a7890/bayern-munich-23-24-home-jersey-red.jpg",
        retailPrice: 89.95,
      },
    }),

    // Juventus
    prisma.jersey.upsert({
      where: {
        clubId_season_type: {
          clubId: "juventus",
          season: "2023-24",
          type: "HOME",
        },
      },
      update: {},
      create: {
        name: "Maillot Domicile Juventus 2023-24",
        clubId: "juventus",
        season: "2023-24",
        type: "HOME",
        brand: "Adidas",
        imageUrl:
          "https://assets.adidas.com/images/w_600,f_auto,q_auto/9e8d7c6b5a4f3210/juventus-23-24-home-jersey-white.jpg",
        retailPrice: 89.95,
      },
    }),

    // Marseille
    prisma.jersey.upsert({
      where: {
        clubId_season_type: {
          clubId: "marseille",
          season: "2023-24",
          type: "HOME",
        },
      },
      update: {},
      create: {
        name: "Maillot Domicile OM 2023-24",
        clubId: "marseille",
        season: "2023-24",
        type: "HOME",
        brand: "Puma",
        imageUrl:
          "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_600,h_600/global/757711/01/mod01/fnd/PNA/fmt/png/Maillot-Replica-Domicile-OM-23/24",
        retailPrice: 84.95,
      },
    }),
  ]);

  console.log("✅ Maillots créés");

  // 4. Créer des utilisateurs de test
  const hashedPassword = await bcrypt.hash("password123", 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@maillothèque.com" },
      update: {},
      create: {
        email: "admin@maillothèque.com",
        username: "admin",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "Maillothèque",
        bio: "Administrateur de la Maillothèque",
        favoriteClubId: "psg",
      },
    }),
    prisma.user.upsert({
      where: { email: "collector@example.com" },
      update: {},
      create: {
        email: "collector@example.com",
        username: "collector",
        password: hashedPassword,
        firstName: "Jean",
        lastName: "Collectionneur",
        bio: "Passionné de maillots de football depuis 15 ans",
        favoriteClubId: "manchester-united",
      },
    }),
    prisma.user.upsert({
      where: { email: "fan@example.com" },
      update: {},
      create: {
        email: "fan@example.com",
        username: "fan",
        password: hashedPassword,
        firstName: "Marie",
        lastName: "Fan",
        bio: "Grande fan du Real Madrid",
        favoriteClubId: "real-madrid",
      },
    }),
  ]);

  console.log("✅ Utilisateurs créés");

  // 5. Créer quelques collections d'exemple
  const psgHomeJersey = await prisma.jersey.findFirst({
    where: { clubId: "psg", season: "2023-24", type: "HOME" },
  });

  const manchesterJersey = await prisma.jersey.findFirst({
    where: { clubId: "manchester-united", season: "2023-24", type: "HOME" },
  });

  const realMadridJersey = await prisma.jersey.findFirst({
    where: { clubId: "real-madrid", season: "2023-24", type: "HOME" },
  });

  if (psgHomeJersey && manchesterJersey && realMadridJersey) {
    await Promise.all([
      prisma.userJersey.upsert({
        where: {
          userId_jerseyId: { userId: users[0].id, jerseyId: psgHomeJersey.id },
        },
        update: {},
        create: {
          userId: users[0].id,
          jerseyId: psgHomeJersey.id,
          size: "L",
          condition: "MINT",
          hasTags: true,
          purchasePrice: 89.99,
          purchaseDate: new Date("2023-08-15"),
          notes: "Acheté le jour de la sortie officielle",
        },
      }),
      prisma.userJersey.upsert({
        where: {
          userId_jerseyId: {
            userId: users[1].id,
            jerseyId: manchesterJersey.id,
          },
        },
        update: {},
        create: {
          userId: users[1].id,
          jerseyId: manchesterJersey.id,
          size: "M",
          condition: "EXCELLENT",
          hasTags: false,
          purchasePrice: 75.0,
          purchaseDate: new Date("2023-09-01"),
          notes: "Porté une fois pour un match",
        },
      }),
      prisma.userJersey.upsert({
        where: {
          userId_jerseyId: {
            userId: users[2].id,
            jerseyId: realMadridJersey.id,
          },
        },
        update: {},
        create: {
          userId: users[2].id,
          jerseyId: realMadridJersey.id,
          size: "S",
          condition: "MINT",
          hasTags: true,
          purchasePrice: 89.95,
          purchaseDate: new Date("2023-07-20"),
          notes: "Maillot de ma collection Real Madrid",
        },
      }),
    ]);

    console.log("✅ Collections créées");
  }

  // 6. Créer quelques wishlists
  const barcelonaJersey = await prisma.jersey.findFirst({
    where: { clubId: "barcelona", season: "2023-24", type: "HOME" },
  });

  const liverpoolJersey = await prisma.jersey.findFirst({
    where: { clubId: "liverpool", season: "2023-24", type: "HOME" },
  });

  if (barcelonaJersey && liverpoolJersey) {
    await Promise.all([
      prisma.wishlist.upsert({
        where: {
          userId_jerseyId: {
            userId: users[0].id,
            jerseyId: barcelonaJersey.id,
          },
        },
        update: {},
        create: {
          userId: users[0].id,
          jerseyId: barcelonaJersey.id,
          priority: 1,
        },
      }),
      prisma.wishlist.upsert({
        where: {
          userId_jerseyId: {
            userId: users[1].id,
            jerseyId: liverpoolJersey.id,
          },
        },
        update: {},
        create: {
          userId: users[1].id,
          jerseyId: liverpoolJersey.id,
          priority: 2,
        },
      }),
    ]);

    console.log("✅ Wishlists créées");
  }

  console.log("🎉 Seed terminé avec succès !");
  console.log("\n📊 Résumé:");
  console.log(`- ${leagues.length} ligues créées`);
  console.log(`- ${clubs.length} clubs créés`);
  console.log(`- ${jerseys.length} maillots créés`);
  console.log(`- ${users.length} utilisateurs créés`);
  console.log("\n👤 Comptes de test:");
  console.log("- admin@maillothèque.com / password123");
  console.log("- collector@example.com / password123");
  console.log("- fan@example.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
