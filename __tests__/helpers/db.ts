import { PrismaClient } from "@prisma/client";

export const prismaTest = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

/**
 * Nettoie toutes les tables de la DB de test
 * À appeler après chaque test d'intégration
 * Supprime les données dans le bon ordre pour respecter les contraintes FK
 */
export async function cleanDatabase() {
  await prismaTest.rating.deleteMany();
  await prismaTest.wishlist.deleteMany();
  await prismaTest.userJersey.deleteMany();
  await prismaTest.friendship.deleteMany();
  await prismaTest.achievement.deleteMany();
  await prismaTest.session.deleteMany();
  await prismaTest.account.deleteMany();
  await prismaTest.verification.deleteMany();
  await prismaTest.jersey.deleteMany();
  await prismaTest.user.deleteMany();
  await prismaTest.club.deleteMany();
  await prismaTest.league.deleteMany();
}

/**
 * Ferme la connexion à la DB de test
 * À appeler à la fin de tous les tests
 */
export async function disconnectDatabase() {
  await prismaTest.$disconnect();
}
