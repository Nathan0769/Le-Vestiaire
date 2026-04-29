import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "@/app/api/jerseys/[id]/rating/route";
import {
  createTestUser,
  createTestSetup,
} from "@/__tests__/helpers/fixtures";
import { cleanDatabase } from "@/__tests__/helpers/db";
import "@/__tests__/setup.integration";

vi.mock("@/lib/get-current-user", () => ({
  getCurrentUser: vi.fn(),
}));

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(body: object) {
  return new Request("http://localhost/api/jerseys/test/rating", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/jerseys/[id]/rating", () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  it("retourne 404 si le maillot n'existe pas", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), makeParams("inexistant"));

    expect(response.status).toBe(404);
  });

  it("retourne les stats de rating sans userRating si non connecté", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const { jersey } = await createTestSetup();
    const response = await GET(new Request("http://localhost"), makeParams(jersey.id));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.averageRating).toBe(0);
    expect(data.totalRatings).toBe(0);
    expect(data.userRating).toBeUndefined();
  });

  it("inclut le userRating si l'utilisateur a déjà noté", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    await POST(makeRequest({ rating: 4 }), makeParams(jersey.id));

    const response = await GET(new Request("http://localhost"), makeParams(jersey.id));
    const data = await response.json();

    expect(data.userRating).toBe(4);
    expect(data.totalRatings).toBe(1);
    expect(data.averageRating).toBe(4);
  });
});

describe("POST /api/jerseys/[id]/rating", () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  it("retourne 401 si non connecté", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const { jersey } = await createTestSetup();
    const response = await POST(makeRequest({ rating: 4 }), makeParams(jersey.id));

    expect(response.status).toBe(401);
  });

  it("retourne 400 si le rating est invalide (< 0.5)", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    const response = await POST(makeRequest({ rating: 0 }), makeParams(jersey.id));

    expect(response.status).toBe(400);
  });

  it("retourne 400 si le rating est invalide (> 5)", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    const response = await POST(makeRequest({ rating: 6 }), makeParams(jersey.id));

    expect(response.status).toBe(400);
  });

  it("retourne 400 si le rating n'est pas un multiple de 0.5", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    const response = await POST(makeRequest({ rating: 3.3 }), makeParams(jersey.id));

    expect(response.status).toBe(400);
  });

  it("retourne 404 si le maillot n'existe pas", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const response = await POST(makeRequest({ rating: 4 }), makeParams("inexistant"));

    expect(response.status).toBe(404);
  });

  it("crée un rating valide", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    const response = await POST(makeRequest({ rating: 4.5 }), makeParams(jersey.id));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.userRating).toBe(4.5);
    expect(data.totalRatings).toBe(1);
  });

  it("met à jour un rating existant (upsert)", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    await POST(makeRequest({ rating: 3 }), makeParams(jersey.id));
    const response = await POST(makeRequest({ rating: 5 }), makeParams(jersey.id));
    const data = await response.json();

    expect(data.userRating).toBe(5);
    expect(data.totalRatings).toBe(1);
  });
});

describe("DELETE /api/jerseys/[id]/rating", () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  it("retourne 401 si non connecté", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const { jersey } = await createTestSetup();
    const response = await DELETE(new Request("http://localhost"), makeParams(jersey.id));

    expect(response.status).toBe(401);
  });

  it("retourne 404 si aucun rating à supprimer", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    const response = await DELETE(new Request("http://localhost"), makeParams(jersey.id));

    expect(response.status).toBe(404);
  });

  it("supprime le rating et recalcule la moyenne", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    await POST(makeRequest({ rating: 4 }), makeParams(jersey.id));

    const response = await DELETE(new Request("http://localhost"), makeParams(jersey.id));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalRatings).toBe(0);
    expect(data.averageRating).toBe(0);
    expect(data.userRating).toBeUndefined();
  });
});
