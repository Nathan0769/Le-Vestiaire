import prisma from "@/lib/prisma";

export async function getUserJerseyCount(userId: string): Promise<number> {
  return prisma.userJersey.count({ where: { userId } });
}

export async function getUserCollectionValue(userId: string): Promise<number> {
  const result = await prisma.userJersey.aggregate({
    where: { userId, purchasePrice: { not: null } },
    _sum: { purchasePrice: true },
  });
  return result._sum.purchasePrice ? Number(result._sum.purchasePrice) : 0;
}

export async function getUserUniqueClubs(userId: string): Promise<number> {
  const rows = await prisma.userJersey.findMany({
    where: { userId },
    select: { jersey: { select: { clubId: true } } },
  });
  return new Set(rows.map((r) => r.jersey.clubId)).size;
}

export async function getUserUniqueLeagues(userId: string): Promise<number> {
  const rows = await prisma.userJersey.findMany({
    where: { userId },
    select: { jersey: { select: { club: { select: { leagueId: true } } } } },
  });
  return new Set(rows.map((r) => r.jersey.club.leagueId)).size;
}

export async function getUserVintageCount(userId: string): Promise<number> {
  const rows = await prisma.userJersey.findMany({
    where: { userId },
    select: { jersey: { select: { season: true } } },
  });
  return rows.filter((r) => {
    const year = parseInt(r.jersey.season.slice(0, 4), 10);
    return !Number.isNaN(year) && year < 2000;
  }).length;
}

export async function getUserPre1990Count(userId: string): Promise<number> {
  const rows = await prisma.userJersey.findMany({
    where: { userId },
    select: { jersey: { select: { season: true } } },
  });
  return rows.filter((r) => {
    const year = parseInt(r.jersey.season.slice(0, 4), 10);
    return !Number.isNaN(year) && year < 1990;
  }).length;
}

export async function getUserFriendCount(userId: string): Promise<number> {
  return prisma.friendship.count({
    where: {
      status: "ACCEPTED",
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
  });
}

export async function getUserRatingCount(userId: string): Promise<number> {
  return prisma.rating.count({ where: { userId } });
}

export async function getUserAcceptedProposalCount(userId: string): Promise<number> {
  return prisma.contributionHistory.count({
    where: { userId, action: "APPROVED" },
  });
}

export async function getUserAcceptedDescriptionCount(userId: string): Promise<number> {
  return prisma.descriptionProposal.count({
    where: { userId, status: "APPROVED" },
  });
}

export async function getUserProfileComplete(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true, favoriteClubId: true, bio: true },
  });
  if (!user) return 0;
  return user.avatar && user.favoriteClubId && user.bio ? 1 : 0;
}

export async function getUserAccountAgeDays(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  if (!user) return 0;
  const diffMs = Date.now() - user.createdAt.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export async function getUserGoalkeeperCount(userId: string): Promise<number> {
  return prisma.userJersey.count({
    where: { userId, jersey: { type: "GOALKEEPER" } },
  });
}

export async function getUserWishlistCount(userId: string): Promise<number> {
  return prisma.wishlist.count({ where: { userId } });
}

export async function getUserMaxJerseysPerClub(userId: string): Promise<number> {
  const rows = await prisma.userJersey.findMany({
    where: { userId },
    select: { jersey: { select: { clubId: true } } },
  });
  if (rows.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const r of rows) {
    counts.set(r.jersey.clubId, (counts.get(r.jersey.clubId) ?? 0) + 1);
  }
  return Math.max(...counts.values());
}

export async function getUserIsFounder(userId: string): Promise<number> {
  const founderEmail = process.env.FOUNDER_EMAIL;
  if (!founderEmail) return 0;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return user?.email === founderEmail ? 1 : 0;
}
