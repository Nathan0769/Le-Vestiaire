import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { isSupporter } from "@/lib/subscription";

export interface FeaturedCollector {
  username: string;
  name: string;
  avatarKey: string | null;
  avatarFrame: string | null;
  isSupporter: boolean;
  favoriteClubName: string | null;
  collectionCount: number;
  jerseyThumbs: string[];
}

const POOL_SIZE = 60;
const FEATURED_COUNT = 8;

// Fisher-Yates : rotation des profils mis en avant. Le tirage est figé pour la
// durée du cache (1h) et change à chaque revalidation, donc on n'affiche pas
// toujours les mêmes têtes tout en gardant un rendu stable pour les crawlers.
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Même filtre que le sitemap : uniquement les collectionneurs qui ont rendu
// leur profil public (leaderboardAnonymous=false, usernameGenerated=false) avec
// une collection non vide. On récupère un pool des plus grosses collections
// (gage de qualité), puis on priorise les profils avec photo (une carte avec
// avatar convainc, une carte avec initiales fait vide). Le statut supporter est
// affiché mais ne joue pas sur l'ordre.
async function fetchFeaturedCollectors(): Promise<FeaturedCollector[]> {
  const users = await prisma.user.findMany({
    where: {
      leaderboardAnonymous: false,
      usernameGenerated: false,
      collection: { some: {} },
    },
    select: {
      username: true,
      name: true,
      avatar: true,
      avatarFrame: true,
      plan: true,
      favoriteClub: { select: { name: true } },
      _count: { select: { collection: true } },
      collection: {
        take: 3,
        orderBy: { createdAt: "desc" },
        select: { jersey: { select: { imageUrl: true } } },
      },
    },
    orderBy: { collection: { _count: "desc" } },
    take: POOL_SIZE,
  });

  const collectors = users.map((user) => ({
    username: user.username,
    name: user.name,
    avatarKey: user.avatar,
    avatarFrame: user.avatarFrame,
    isSupporter: isSupporter(user),
    favoriteClubName: user.favoriteClub?.name ?? null,
    collectionCount: user._count.collection,
    jerseyThumbs: user.collection.map((item) => item.jersey.imageUrl),
  }));

  // Photos d'abord, puis rotation dans chaque groupe. Les profils sans avatar ne
  // servent que de secours si trop peu de profils ont une photo.
  const withPhoto = shuffle(collectors.filter((c) => c.avatarKey));
  const withoutPhoto = shuffle(collectors.filter((c) => !c.avatarKey));

  return [...withPhoto, ...withoutPhoto].slice(0, FEATURED_COUNT);
}

export const getFeaturedCollectors = unstable_cache(
  fetchFeaturedCollectors,
  ["featured-collectors"],
  { revalidate: 3600, tags: ["featured-collectors"] }
);
