import { afterEach, afterAll, beforeAll, vi } from "vitest";
import { cleanDatabase, disconnectDatabase, prismaTest } from "./helpers/db";
import { setupDefaultMocks } from "./helpers/mocks";

// Mock du prisma principal pour utiliser prismaTest
vi.mock("@/lib/prisma", () => ({
  default: prismaTest,
}));

beforeAll(async () => {
  setupDefaultMocks();

  try {
    await prismaTest.$connect();
    console.log("✅ Connecté à la DB de test");
  } catch (error) {
    console.error("❌ Erreur de connexion à la DB de test:", error);
    throw error;
  }
});

afterEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
  console.log("✅ Déconnecté de la DB de test");
});
