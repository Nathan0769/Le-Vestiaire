import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/user/profile/route";
import { createTestUser } from "@/__tests__/helpers/fixtures";
import { cleanDatabase } from "@/__tests__/helpers/db";
import "@/__tests__/setup.integration";

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

describe("GET /api/user/profile", () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  it("retourne 401 si non connecté", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("retourne 404 si l'utilisateur n'existe plus en DB", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "id-inexistant" } as never);

    const response = await GET();

    expect(response.status).toBe(404);
  });

  it("retourne le profil complet de l'utilisateur", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser({
      email: `profile-${Date.now()}@example.com`,
      name: "Jean Dupont",
    });
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(user.id);
    expect(data.email).toBe(user.email);
    expect(data.name).toBe("Jean Dupont");
    expect(data.stats).toBeDefined();
    expect(data.stats.collectionCount).toBe(0);
    expect(data.stats.wishlistCount).toBe(0);
  });

  it("retourne isPro: false pour un utilisateur sans plan PRO", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const response = await GET();
    const data = await response.json();

    expect(data.isPro).toBe(false);
  });

  it("retourne avatarUrl via signed URL si l'utilisateur a un avatar", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser({ avatar: "avatar/user-123.jpg" });
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const response = await GET();
    const data = await response.json();

    expect(data.image).toBe("https://test.supabase.co/avatar.jpg");
  });

  it("retourne favoriteClub: null si pas de club favori", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const response = await GET();
    const data = await response.json();

    expect(data.favoriteClub).toBeNull();
  });
});
