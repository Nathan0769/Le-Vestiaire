import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/jerseys/[id]/collection/route";
import { DELETE, PATCH } from "@/app/api/user-jerseys/[id]/route";
import {
  createTestUser,
  createTestSetup,
} from "@/__tests__/helpers/fixtures";
import { cleanDatabase } from "@/__tests__/helpers/db";
import "@/__tests__/setup.integration";

vi.mock("@/lib/get-current-user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/r2-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/r2-storage")>();
  return {
    ...actual,
    getR2PresignedUrl: vi.fn().mockResolvedValue("https://test.r2.dev/photo.jpg"),
    deleteFromR2: vi.fn().mockResolvedValue(undefined),
  };
});

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

function makePatchRequest(body: object) {
  return new Request("http://localhost/api/user-jerseys/test", {
    method: "PATCH",
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
    expect(data.count).toBe(0);
  });

  it("retourne isInCollection: false si le maillot n'est pas dans la collection", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    const response = await GET(new Request("http://localhost"), makeParams(jersey.id));
    const data = await response.json();

    expect(data.isInCollection).toBe(false);
    expect(data.count).toBe(0);
    expect(data.userJerseys).toEqual([]);
  });

  it("retourne isInCollection: true avec les données si le maillot est dans la collection", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    await POST(makeRequest({ condition: "MINT" }), makeParams(jersey.id));

    const response = await GET(new Request("http://localhost"), makeParams(jersey.id));
    const data = await response.json();

    expect(data.isInCollection).toBe(true);
    expect(data.count).toBe(1);
    expect(data.userJerseys).toHaveLength(1);
  });

  it("retourne count: 2 si deux versions sont présentes", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    await POST(makeRequest({ condition: "MINT", version: "REPLICA" }), makeParams(jersey.id));
    await POST(makeRequest({ condition: "MINT", version: "AUTHENTIC" }), makeParams(jersey.id));

    const response = await GET(new Request("http://localhost"), makeParams(jersey.id));
    const data = await response.json();

    expect(data.isInCollection).toBe(true);
    expect(data.count).toBe(2);
    expect(data.userJerseys).toHaveLength(2);
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
      makeRequest({ condition: "MINT" }),
      makeParams(jersey.id)
    );

    expect(response.status).toBe(401);
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

  it("ajoute un maillot à la collection avec version REPLICA par défaut", async () => {
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
    expect(data.userJersey.version).toBe("REPLICA");
  });

  it("ajoute un maillot avec une version spécifique", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    const response = await POST(
      makeRequest({ condition: "MINT", version: "MATCH_WORN", matchDescription: "PSG vs OL" }),
      makeParams(jersey.id)
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.userJersey.version).toBe("MATCH_WORN");
    expect(data.userJersey.matchDescription).toBe("PSG vs OL");
  });

  it("permet d'ajouter deux versions différentes du même maillot", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    const r1 = await POST(makeRequest({ condition: "MINT", version: "REPLICA" }), makeParams(jersey.id));
    const r2 = await POST(makeRequest({ condition: "MINT", version: "AUTHENTIC" }), makeParams(jersey.id));

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
  });

  it("ajoute un maillot signé avec les champs correspondants", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    const response = await POST(
      makeRequest({ condition: "MINT", isSigned: true, signedBy: "Mbappé", hasAuthCertificate: true }),
      makeParams(jersey.id)
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.userJersey.isSigned).toBe(true);
    expect(data.userJersey.signedBy).toBe("Mbappé");
    expect(data.userJersey.hasAuthCertificate).toBe(true);
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

describe("DELETE /api/user-jerseys/[id]", () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  it("retourne 401 si non connecté", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await DELETE(new Request("http://localhost"), makeParams("any-id"));

    expect(response.status).toBe(401);
  });

  it("retourne 404 si le userJersey n'existe pas", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const response = await DELETE(new Request("http://localhost"), makeParams("id-inexistant"));

    expect(response.status).toBe(404);
  });

  it("supprime un maillot de la collection", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    const addResponse = await POST(makeRequest({ condition: "MINT" }), makeParams(jersey.id));
    const addData = await addResponse.json();
    const userJerseyId = addData.userJersey.id;

    const response = await DELETE(new Request("http://localhost"), makeParams(userJerseyId));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it("ne peut pas supprimer le maillot d'un autre utilisateur", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    vi.mocked(getCurrentUser).mockResolvedValue({ id: user1.id } as never);
    const { jersey } = await createTestSetup();
    const addData = await (await POST(makeRequest({ condition: "MINT" }), makeParams(jersey.id))).json();
    const userJerseyId = addData.userJersey.id;

    vi.mocked(getCurrentUser).mockResolvedValue({ id: user2.id } as never);
    const response = await DELETE(new Request("http://localhost"), makeParams(userJerseyId));

    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/user-jerseys/[id]", () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  it("retourne 401 si non connecté", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await PATCH(makePatchRequest({ condition: "GOOD" }), makeParams("any-id"));

    expect(response.status).toBe(401);
  });

  it("retourne 404 si le userJersey n'existe pas", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const response = await PATCH(makePatchRequest({ condition: "GOOD" }), makeParams("id-inexistant"));

    expect(response.status).toBe(404);
  });

  it("met à jour un maillot de la collection", async () => {
    const { getCurrentUser } = await import("@/lib/get-current-user");
    const user = await createTestUser();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: user.id } as never);

    const { jersey } = await createTestSetup();
    const addData = await (await POST(makeRequest({ condition: "MINT" }), makeParams(jersey.id))).json();
    const userJerseyId = addData.userJersey.id;

    const response = await PATCH(
      makePatchRequest({ condition: "GOOD", version: "AUTHENTIC", isSigned: false, hasAuthCertificate: false, isGift: false, isFromMysteryBox: false, hasTags: false }),
      makeParams(userJerseyId)
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.userJersey.condition).toBe("GOOD");
    expect(data.userJersey.version).toBe("AUTHENTIC");
  });
});
