import { describe, it, expect } from "vitest";
import {
  availabilityTransitions,
  type StoredVariant,
} from "@/lib/partner-shops/inferred-sales";

const NOW = new Date("2026-11-02T03:55:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600 * 1000);

const stored = (over: Partial<StoredVariant> = {}): StoredVariant => ({
  id: "v1",
  externalId: "ext1",
  available: true,
  removedAt: null,
  availabilityChangedAt: hoursAgo(240),
  price: 49.99,
  ...over,
});

describe("availabilityTransitions", () => {
  it("compte une vente SOLD_OUT quand une taille dispo passe en épuisé", () => {
    const r = availabilityTransitions({
      stored: [stored()],
      feed: [{ externalId: "ext1", available: false, price: 49.99 }],
      productStillListed: true,
      now: NOW,
    });
    expect(r.sales).toEqual([{ variantId: "v1", kind: "SOLD_OUT", price: 49.99 }]);
    expect(r.changes).toEqual([
      { variantId: "v1", available: false, removedAt: null, availabilityChangedAt: NOW },
    ]);
  });

  it("compte une vente REMOVED quand une taille dispo disparaît d'un produit encore en ligne", () => {
    const r = availabilityTransitions({
      stored: [stored()],
      feed: [],
      productStillListed: true,
      now: NOW,
    });
    expect(r.sales).toEqual([{ variantId: "v1", kind: "REMOVED", price: 49.99 }]);
    expect(r.changes).toEqual([
      { variantId: "v1", available: false, removedAt: NOW, availabilityChangedAt: NOW },
    ]);
  });

  it("ne compte rien quand le produit entier disparaît du flux", () => {
    const r = availabilityTransitions({
      stored: [stored()],
      feed: [],
      productStillListed: false,
      now: NOW,
    });
    expect(r).toEqual({ sales: [], cancelVariantIds: [], changes: [] });
  });

  it("annule la vente quand la taille revient moins de 48 h après", () => {
    const r = availabilityTransitions({
      stored: [stored({ available: false, availabilityChangedAt: hoursAgo(30) })],
      feed: [{ externalId: "ext1", available: true, price: 49.99 }],
      productStillListed: true,
      now: NOW,
    });
    expect(r.cancelVariantIds).toEqual(["v1"]);
    expect(r.changes).toEqual([
      { variantId: "v1", available: true, removedAt: null, availabilityChangedAt: NOW },
    ]);
  });

  it("annule aussi quand une taille retirée réapparaît moins de 48 h après", () => {
    const r = availabilityTransitions({
      stored: [stored({ available: false, removedAt: hoursAgo(20), availabilityChangedAt: hoursAgo(20) })],
      feed: [{ externalId: "ext1", available: true, price: 49.99 }],
      productStillListed: true,
      now: NOW,
    });
    expect(r.cancelVariantIds).toEqual(["v1"]);
  });

  it("garde la vente quand la taille revient plus de 48 h après (réassort)", () => {
    const r = availabilityTransitions({
      stored: [stored({ available: false, availabilityChangedAt: hoursAgo(72) })],
      feed: [{ externalId: "ext1", available: true, price: 49.99 }],
      productStillListed: true,
      now: NOW,
    });
    expect(r.cancelVariantIds).toEqual([]);
    expect(r.sales).toEqual([]);
  });

  it("ne compte rien quand une taille déjà épuisée disparaît", () => {
    const r = availabilityTransitions({
      stored: [stored({ available: false })],
      feed: [],
      productStillListed: true,
      now: NOW,
    });
    expect(r.sales).toEqual([]);
  });

  it("ne produit rien pour une taille inchangée", () => {
    const r = availabilityTransitions({
      stored: [stored()],
      feed: [{ externalId: "ext1", available: true, price: 44.99 }],
      productStillListed: true,
      now: NOW,
    });
    expect(r).toEqual({ sales: [], cancelVariantIds: [], changes: [] });
  });
});
