import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/auth/me/route";
import { createTestUser } from "@/__tests__/helpers/fixtures";
import { cleanDatabase, prismaTest } from "@/__tests__/helpers/db";
import "@/__tests__/setup.integration";

type MockSessionUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image: string | null;
  role: string;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
};

vi.mock("@/lib/get-current-user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "https://test.supabase.co/avatar.jpg" },
          error: null,
        }),
      })),
    },
  })),
}));

describe("GET /api/auth/me", () => {
  beforeEach(async () => {
    await cleanDatabase();

    vi.clearAllMocks();
  });

  it("retourne null quand aucun utilisateur n'est connecté", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeNull();
  });

  it("retourne les infos utilisateur quand connecté", async () => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const username = `testuser-${timestamp}`;

    const user = await createTestUser({
      email,
      name: "Test User",
      username,
      avatar: "avatar.jpg",
    });

    await prismaTest.account.create({
      data: {
        userId: user.id,
        accountId: "google-123",
        providerId: "google",
      },
    });

    const { getCurrentUser } = await import("@/lib/get-current-user");
    const mockUser: Partial<MockSessionUser> = { id: user.id };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as MockSessionUser);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      id: user.id,
      email,
      name: "Test User",
      username,
      avatar: "avatar.jpg",
      avatarUrl: "https://test.supabase.co/avatar.jpg",
      role: "user",
      authProvider: {
        hasGoogle: true,
        hasPassword: false,
        isGoogleOnly: true,
      },
    });
    expect(data.createdAt).toBeDefined();
  });

  it("détecte un compte avec mot de passe", async () => {
    const user = await createTestUser({
      email: `password-${Date.now()}@example.com`,
      name: "Password User",
    });

    await prismaTest.account.create({
      data: {
        userId: user.id,
        accountId: user.email,
        providerId: "credential",
        password: "hashed_password",
      },
    });

    const { getCurrentUser } = await import("@/lib/get-current-user");
    const mockUser: Partial<MockSessionUser> = { id: user.id };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as MockSessionUser);

    const response = await GET();
    const data = await response.json();

    expect(data.authProvider).toMatchObject({
      hasGoogle: false,
      hasPassword: true,
      isGoogleOnly: false,
    });
  });

  it("gère un utilisateur avec Google ET mot de passe", async () => {
    const user = await createTestUser({
      email: `both-${Date.now()}@example.com`,
      name: "Both User",
    });

    await prismaTest.account.createMany({
      data: [
        {
          userId: user.id,
          accountId: "google-456",
          providerId: "google",
        },
        {
          userId: user.id,
          accountId: user.email,
          providerId: "credential",
          password: "hashed_password",
        },
      ],
    });

    const { getCurrentUser } = await import("@/lib/get-current-user");
    const mockUser: Partial<MockSessionUser> = { id: user.id };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as MockSessionUser);

    const response = await GET();
    const data = await response.json();

    expect(data.authProvider).toMatchObject({
      hasGoogle: true,
      hasPassword: true,
      isGoogleOnly: false,
    });
  });

  it("retourne null si l'utilisateur n'existe plus en DB", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const mockUser: Partial<MockSessionUser> = { id: "non-existent-id" };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as MockSessionUser);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeNull();
  });

  it("retourne avatarUrl null si pas d'avatar", async () => {
    const user = await createTestUser({
      email: `no-avatar-${Date.now()}@example.com`,
      name: "No Avatar",
      avatar: null,
    });

    const { getCurrentUser } = await import("@/lib/get-current-user");
    const mockUser: Partial<MockSessionUser> = { id: user.id };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as MockSessionUser);

    const response = await GET();
    const data = await response.json();

    expect(data.avatar).toBeNull();
    expect(data.avatarUrl).toBeNull();
  });
});
