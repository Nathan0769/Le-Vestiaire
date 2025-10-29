import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/user/avatar/upload/route";
import { createTestUser } from "@/__tests__/helpers/fixtures";
import { cleanDatabase } from "@/__tests__/helpers/db";
import { createValidJpegFile } from "@/__tests__/helpers/file-mocks";
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
        upload: vi.fn().mockResolvedValue({
          data: { path: "user-id/123456.jpg" },
          error: null,
        }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "https://test.supabase.co/avatar/signed-url.jpg" },
          error: null,
        }),
      })),
    },
  })),
}));

vi.mock("@/lib/rate-limit", () => ({
  moderateRateLimit: {},
  getRateLimitIdentifier: vi.fn().mockResolvedValue("test-identifier"),
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 60000,
  }),
}));

vi.mock("@/lib/file-validation", () => ({
  validateImageFile: vi.fn(),
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
}));

describe("POST /api/user/avatar/upload - Tests simplifiés", () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  it("retourne 401 si utilisateur non authentifié", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const formData = new FormData();
    formData.append("file", createValidJpegFile());

    const request = new Request(
      "http://localhost:3000/api/user/avatar/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Non authentifié");
  });

  it("retourne 400 si aucun fichier fourni", async () => {
    const user = await createTestUser({
      email: "test@example.com",
      name: "Test",
    });

    const { getCurrentUser } = await import("@/lib/get-current-user");
    const mockUser: Partial<MockSessionUser> = { id: user.id };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as MockSessionUser);

    const formData = new FormData();
    const request = new Request(
      "http://localhost:3000/api/user/avatar/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Aucun fichier reçu");
  });
});
