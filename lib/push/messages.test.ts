import { describe, it, expect } from "vitest";
import { buildPushMessage, buildWishlistPromoMessage } from "./messages";

describe("buildPushMessage", () => {
  it("construit le message en français", () => {
    expect(buildPushMessage("POST_LIKED", "kop_end", "fr")).toEqual({
      title: "Nouveau like",
      body: "kop_end a aimé ta publication",
    });
  });

  it("construit le message dans la langue de l'appareil", () => {
    expect(buildPushMessage("POST_LIKED", "kop_end", "en")).toEqual({
      title: "New like",
      body: "kop_end liked your post",
    });
  });

  it("retombe sur le français quand la langue de l'appareil est inconnue", () => {
    expect(buildPushMessage("NEW_FOLLOWER", "kop_end", null).title).toBe(
      "Nouvel abonné",
    );
    expect(buildPushMessage("NEW_FOLLOWER", "kop_end", "ja").title).toBe(
      "Nouvel abonné",
    );
  });

  it("couvre le type virtuel de demande d'abonnement", () => {
    expect(
      buildPushMessage("FOLLOW_REQUEST_RECEIVED", "kop_end", "en").body,
    ).toBe("kop_end wants to follow you");
  });

  it("utilise un message générique pour un type sans texte dédié", () => {
    expect(buildPushMessage("ACHIEVEMENT_UNLOCKED", "kop_end", "en")).toEqual({
      title: "Le Vestiaire",
      body: "You have a new notification",
    });
  });
});

describe("buildWishlistPromoMessage", () => {
  const jersey = "Maillot Domicile Liverpool 2025-26";

  it("nomme le maillot et son économie pour une seule promo", () => {
    expect(buildWishlistPromoMessage(1, "48 €", "fr", jersey)).toEqual({
      title: "Promo sur ta wishlist",
      body: "Maillot Domicile Liverpool 2025-26\u00a0: -48 €",
    });
  });

  it("compte les autres promos au singulier", () => {
    expect(buildWishlistPromoMessage(2, "48 €", "fr", jersey).body).toBe(
      "Maillot Domicile Liverpool 2025-26\u00a0: -48 €, et 1 autre maillot"
    );
  });

  it("compte les autres promos au pluriel", () => {
    expect(buildWishlistPromoMessage(3, "£40", "en", "Liverpool Home Jersey 2025-26").body).toBe(
      "Liverpool Home Jersey 2025-26: £40 off, and 2 more"
    );
  });

  it("retombe sur le français pour une langue inconnue", () => {
    expect(buildWishlistPromoMessage(2, "10 €", "ja", jersey).title).toBe("Promo sur ta wishlist");
  });
});
