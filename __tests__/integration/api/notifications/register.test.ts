import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "@/app/api/notifications/register/route";
import { createTestUser } from "@/__tests__/helpers/fixtures";
import { cleanDatabase, prismaTest } from "@/__tests__/helpers/db";
import "@/__tests__/setup.integration";

vi.mock("@/lib/get-current-user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  standardRateLimit: {},
  getRateLimitIdentifier: vi.fn().mockResolvedValue("test-identifier"),
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    limit: 20,
    remaining: 19,
    reset: Date.now() + 60000,
  }),
}));

async function actAs(userId: string | null) {
  const { getCurrentUser } = await import("@/lib/get-current-user");
  vi.mocked(getCurrentUser).mockResolvedValue(
    (userId ? { id: userId } : null) as Awaited<ReturnType<typeof getCurrentUser>>
  );
}

function deleteRequest(body: unknown) {
  return new Request("http://localhost:3000/api/notifications/register", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function createPushToken(userId: string, token: string) {
  return prismaTest.pushToken.create({
    data: { userId, token, platform: "ios" },
  });
}

describe("DELETE /api/notifications/register", () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  it("retourne 401 si utilisateur non authentifié", async () => {
    await actAs(null);
    const response = await DELETE(deleteRequest({ token: "abc" }));
    expect(response.status).toBe(401);
  });

  it("supprime le token push de l'appareil à la déconnexion", async () => {
    const user = await createTestUser();
    await createPushToken(user.id, "device-1");
    await actAs(user.id);

    const response = await DELETE(deleteRequest({ token: "device-1" }));

    expect(response.status).toBe(200);
    expect(await prismaTest.pushToken.count({ where: { token: "device-1" } })).toBe(0);
  });

  it("ne supprime pas le token d'un autre utilisateur", async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    await createPushToken(owner.id, "device-owner");
    await actAs(other.id);

    const response = await DELETE(deleteRequest({ token: "device-owner" }));

    expect(response.status).toBe(200);
    expect(await prismaTest.pushToken.count({ where: { token: "device-owner" } })).toBe(1);
  });

  it("retourne 400 sans token", async () => {
    const user = await createTestUser();
    await actAs(user.id);
    const response = await DELETE(deleteRequest({}));
    expect(response.status).toBe(400);
  });
});
