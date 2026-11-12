import { describe, it, expect, vi } from "vitest";
import { createTestUser } from "@/__tests__/helpers/fixtures";
import { getCurrentAnnouncement, markAnnouncementSeen } from "@/lib/announcements/current";
import "@/__tests__/setup.integration";
vi.mock("next-intl/server", async () => (await import("@/__tests__/helpers/next-intl-server")).nextIntlServerMock());

vi.mock("@/lib/r2-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/r2-storage")>();
  return { ...actual, getR2PublicUrl: vi.fn((_b: string, p: string) => `https://test.r2.dev/${p}`) };
});

describe("annonces de nouveautés", () => {
  // Admin : voit l'annonce de Noël avant sa sortie, le test ne dépend pas de la date du jour.
  const admin = () => createTestUser({ role: "admin" });

  it("montre l'annonce traduite sur une page, en lignes icône, titre, phrase, sans image", async () => {
    const user = await admin();
    const current = await getCurrentAnnouncement(user, { kind: "web" }, "en");
    expect([current?.cards.length, current?.cards[0].title, current?.cards[0].items.map((i) => i.icon), current?.cards[0].imageUrl, current?.cta.target]).toEqual([
      1,
      "Your Christmas wishlist",
      ["gift", "link", "bell"],
      null,
      "wishlist",
    ]);
  });

  it("traduit les lignes pour l'iOS", async () => {
    const user = await admin();
    const current = await getCurrentAnnouncement(user, { kind: "ios", version: "1.7" }, "fr");
    expect(current?.cards[0].items[1].title).toBe("Un lien pour tes proches");
  });

  it("vue sur iPhone, elle ne revient pas sur le web", async () => {
    const user = await admin();
    await markAnnouncementSeen(user.id, "2026-12-wishlist-noel");
    expect(await getCurrentAnnouncement(user, { kind: "web" }, "fr")).toBeNull();
  });

  it("refuse un id inconnu", async () => {
    const user = await admin();
    expect(await markAnnouncementSeen(user.id, "inconnue")).toBe(false);
  });
});
