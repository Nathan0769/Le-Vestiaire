import { PrismaClient } from "@prisma/client";
import { testDatabaseError } from "./test-database-guard";

// vitest.setup.ts compare déjà à DATABASE_URL ; ici DATABASE_URL vaut la dev,
// seul l'endpoint de prod connu peut encore être vérifié.
function assertTestDatabase(): string {
  if (process.env.VITEST_PROJECT === "unit") {
    throw new Error("Ce test touche la base : le renommer en *.integration.test.ts (exclu du pre-push).");
  }
  const url = process.env.DATABASE_URL_DEV;
  const unsafe = testDatabaseError(url, undefined);
  if (unsafe || !url) throw new Error(`DANGER: ${unsafe} Vérifiez votre .env.`);
  return url;
}

const devUrl = assertTestDatabase();

export const prismaTest = new PrismaClient({
  datasources: {
    db: {
      url: devUrl,
    },
  },
});

/**
 * Nettoie toutes les tables de la DB de test
 * À appeler après chaque test d'intégration
 * Supprime les données dans le bon ordre pour respecter les contraintes FK
 */
export async function cleanDatabase() {
  assertTestDatabase();
  await prismaTest.notification.deleteMany();
  await prismaTest.postReport.deleteMany();
  await prismaTest.postCommentLike.deleteMany();
  await prismaTest.postComment.deleteMany();
  await prismaTest.postLike.deleteMany();
  await prismaTest.post.deleteMany();
  await prismaTest.block.deleteMany();
  await prismaTest.followRequest.deleteMany();
  await prismaTest.follow.deleteMany();
  await prismaTest.rating.deleteMany();
  await prismaTest.wishlist.deleteMany();
  await prismaTest.userJersey.deleteMany();
  await prismaTest.achievement.deleteMany();
  await prismaTest.userActivityDay.deleteMany();
  await prismaTest.session.deleteMany();
  await prismaTest.account.deleteMany();
  await prismaTest.verification.deleteMany();
  await prismaTest.jersey.deleteMany();
  await prismaTest.user.deleteMany();
  await prismaTest.club.deleteMany();
  await prismaTest.league.deleteMany();
  await prismaTest.errorEvent.deleteMany();
}

/**
 * Ferme la connexion à la DB de test
 * À appeler à la fin de tous les tests
 */
export async function disconnectDatabase() {
  await prismaTest.$disconnect();
}
