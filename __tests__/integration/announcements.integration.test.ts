import { describe, it, expect, vi } from "vitest";
import { createTestUser } from "@/__tests__/helpers/fixtures";
import { getCurrentAnnouncement, markAnnouncementSeen } from "@/lib/announcements/current";
import "@/__tests__/setup.integration";

vi.mock("@/lib/r2-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/r2-storage")>();
  return { ...actual, getR2PublicUrl: vi.fn((_b: string, p: string) => `https://test.r2.dev/${p}`) };
});

describe("annonces de nouveautés", () => {
  // Admin : voit l'annonce de Noël avant sa sortie, le test ne dépend pas de la date du jour.
  const admin = () => createTestUser({ role: "admin" });

  it("montre l'annonce traduite avec ses images et son bouton", async () => {
    const user = await admin();
    const current = await getCurrentAnnouncement(user, { kind: "web" }, "en");
    expect([current?.cards[0].title, current?.cta.target, current?.cards[0].imageUrl]).toEqual([
      "Your letter to Santa",
      "wishlist",
      "https://test.r2.dev/announcements/2026-12-wishlist-noel/list-v2.jpg",
    ]);
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
