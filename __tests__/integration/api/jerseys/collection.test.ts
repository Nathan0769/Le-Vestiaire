import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "@/app/api/jerseys/[id]/collection/route";
import {
  createTestUser,
  createTestSetup,
} from "@/__tests__/helpers/fixtures";
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
          data: { signedUrl: "https://test.supabase.co/photo.jpg" },
          error: null,
        }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      })),
    },
  })),
}));

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(body: object) {
  return new Request("http://localhost/api/jerseys/test/collection", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/jerseys/[id]/collection", () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  it("retourne isInCollection: false si non connecté", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const { jersey } = await createTestSetup();
    const response = await GET(new Request("http://localhost"), makeParams(jersey.id));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isInCollection).toBe(false);
  });

  it("retourne isInCollection: false si le maillot n'est pas dans la collection", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    const response = await GET(new Request("http://localhost"), makeParams(jersey.id));
    const data = await response.json();

    expect(data.isInCollection).toBe(false);
    expect(data.userJersey).toBeNull();
  });
});

describe("POST /api/jerseys/[id]/collection", () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  it("retourne 401 si non connecté", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const { jersey } = await createTestSetup();
    const response = await POST(
      makeRequest({ size: "L", condition: "MINT" }),
      makeParams(jersey.id)
    );

    expect(response.status).toBe(401);
  });

  it("retourne 400 si la taille est manquante", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    const response = await POST(
      makeRequest({ condition: "MINT" }),
      makeParams(jersey.id)
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("taille");
  });

  it("retourne 400 si l'état est manquant", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    const response = await POST(
      makeRequest({ size: "L" }),
      makeParams(jersey.id)
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("état");
  });

  it("retourne 404 si le maillot n'existe pas", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const response = await POST(
      makeRequest({ size: "L", condition: "MINT" }),
      makeParams("jersey-inexistant")
    );

    expect(response.status).toBe(404);
  });

  it("ajoute un maillot à la collection", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    const response = await POST(
      makeRequest({ size: "L", condition: "MINT" }),
      makeParams(jersey.id)
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.userJersey.size).toBe("L");
    expect(data.userJersey.condition).toBe("MINT");
  });

  it("retourne 400 si le maillot est déjà dans la collection", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    await POST(makeRequest({ size: "L", condition: "MINT" }), makeParams(jersey.id));
    const response = await POST(
      makeRequest({ size: "M", condition: "GOOD" }),
      makeParams(jersey.id)
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("déjà");
  });

  it("retourne 400 si le numéro de maillot est hors limites", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    const response = await POST(
      makeRequest({ size: "L", condition: "MINT", playerNumber: 1000 }),
      makeParams(jersey.id)
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("numéro");
  });
});

describe("DELETE /api/jerseys/[id]/collection", () => {
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

  it("retourne 404 si le maillot n'est pas dans la collection", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    const response = await DELETE(new Request("http://localhost"), makeParams(jersey.id));

    expect(response.status).toBe(404);
  });

  it("supprime un maillot de la collection", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    await POST(makeRequest({ size: "L", condition: "MINT" }), makeParams(jersey.id));

    const response = await DELETE(new Request("http://localhost"), makeParams(jersey.id));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
