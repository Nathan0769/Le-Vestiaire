import { describe, it, expect } from "vitest";
import { buildReminderEmail } from "@/lib/reminder-email";
import { EMAIL_LOGO_URL } from "@/emails/reminder-no-jersey";

const base = { userId: "u1", userName: "Léo", catalogCount: 12480 };

describe("buildReminderEmail", () => {
  it("écrit J+1 dans la langue du compte, bouton vers le catalogue de cette langue", async () => {
    const { subject, html } = await buildReminderEmail({ ...base, step: 1, locale: "en" });
    expect(subject).toBe("Add your first jersey");
    expect(html).toContain('lang="en"');
    expect(html).toContain("Hi Léo,");
    expect(html).toContain("12,480 jerseys are already in the catalogue");
    expect(html).toMatch(/href="[^"]+\/en\/jerseys"/);
  });

  it("garde le lien de désinscription et aucun paramètre de suivi", async () => {
    const { html } = await buildReminderEmail({ ...base, step: 30, locale: "fr" });
    expect(html).toContain("/api/unsubscribe?userId=u1&amp;token=");
    expect(html).not.toContain("utm_");
  });

  it("n'a qu'une image, le logo, à la même adresse pour tous (pas de pixel de suivi)", async () => {
    const { html } = await buildReminderEmail({ ...base, step: 1, locale: "fr" });
    const sources = [...html.matchAll(/<img[^>]*src="([^"]+)"/g)].map((m) => m[1]);
    expect(sources).toEqual([EMAIL_LOGO_URL]);
    expect(EMAIL_LOGO_URL).not.toContain("?");
  });
});
