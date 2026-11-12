import { describe, it, expect } from "vitest";
import { pickAnnouncement, idsToMarkSeen, type Announcement } from "@/lib/announcements/pick";

const ann = (id: string, publishedAt: string, over: Partial<Announcement> = {}): Announcement => ({
  id,
  publishedAt,
  ctaTarget: "wishlist",
  cards: [{ key: "a", items: [], image: { web: `announcements/${id}/a-web.jpg`, ios: `announcements/${id}/a-ios.jpg` } }],
  ...over,
});

const catalog = [ann("old", "2026-09-01"), ann("noel", "2026-12-05", { minIosVersion: "1.7" })];
const now = new Date("2026-12-10T10:00:00Z");
const member = { createdAt: new Date("2026-01-01"), isAdmin: false };
const web = { kind: "web" } as const;
const pick = (over: Partial<Parameters<typeof pickAnnouncement>[0]> = {}) =>
  pickAnnouncement({ catalog, now, user: member, seenIds: new Set(), platform: web, ...over })?.id ?? null;

describe("pickAnnouncement", () => {
  it("montre la plus récente annonce publiée et pas encore vue", () => {
    expect(pick()).toBe("noel");
  });

  it("ne remontre pas une annonce déjà vue, ni les plus anciennes derrière", () => {
    expect(pick({ seenIds: new Set(["noel", "old"]) })).toBeNull();
  });

  it("n'annonce rien avant la date de publication", () => {
    expect(pick({ now: new Date("2026-12-01"), seenIds: new Set(["old"]) })).toBeNull();
  });

  it("montre une annonce à venir à un admin, pour la tester avant la sortie", () => {
    expect(pick({ now: new Date("2026-12-01"), user: { ...member, isAdmin: true } })).toBe("noel");
  });

  it("ne montre rien à un compte créé après la publication (il a eu l'onboarding)", () => {
    expect(pick({ user: { ...member, createdAt: new Date("2026-12-08") } })).toBeNull();
  });

  it("n'affiche plus une annonce de plus de 45 jours", () => {
    expect(pick({ now: new Date("2027-02-01") })).toBeNull();
  });

  it("iOS : attend la version qui contient la nouveauté", () => {
    expect(pick({ platform: { kind: "ios", version: "1.6.5" }, seenIds: new Set(["old"]) })).toBeNull();
    expect(pick({ platform: { kind: "ios", version: "1.7" } })).toBe("noel");
  });

  it("iOS sans version connue : rien d'exigeant une version", () => {
    expect(pick({ platform: { kind: "ios", version: null }, seenIds: new Set(["old"]) })).toBeNull();
  });
});

describe("idsToMarkSeen", () => {
  it("marque l'annonce fermée et les plus anciennes, pour ne pas les enchaîner", () => {
    expect(idsToMarkSeen(catalog, "noel").sort()).toEqual(["noel", "old"]);
  });

  it("id inconnu : rien", () => {
    expect(idsToMarkSeen(catalog, "inconnu")).toEqual([]);
  });
});
