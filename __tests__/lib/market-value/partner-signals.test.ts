import { describe, it, expect } from "vitest";
import { toPartnerSignals } from "@/lib/market-value/providers/partners";

const NOW = new Date("2026-11-02T04:00:00Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000);
const SHOP = "leparcamaillots";

const product = (title: string, over: { price?: number; available?: boolean; shop?: string } = {}) => ({
  jerseyId: "j1",
  shop: over.shop ?? SHOP,
  title,
  price: over.price ?? 44.99,
  available: over.available ?? true,
});

const sale = (title: string, soldAt: Date, price = 44.99) => ({
  jerseyId: "j1",
  shop: SHOP,
  title,
  price,
  soldAt,
});

describe("toPartnerSignals", () => {
  it("un produit de référence dispo donne un prix demandé à l'état neuf", () => {
    const signals = toPartnerSignals({
      products: [product("Nantes Domicile 2025-26 (XL/XXL)")],
      sales: [],
      now: NOW,
    });
    expect(signals.get("j1")).toEqual([
      { price: 44.99, type: "asking", source: "partner:leparcamaillots", condition: "MINT" },
    ]);
  });

  it.each([
    "Spezia Third 2023-24 (XL) [stock pro]",
    "Aalborg Extérieur LS 2025-26 (XL)",
    "Hammarby IF Domicile 2021 (S) (Womens)",
    "Bristol Rovers Extérieur 2022-23 (3XL) [match day]",
    "Virtus Lanciano Domicile 2014-15 (S) [with short]",
  ])("aucun signal hors référence : %s", (title) => {
    const signals = toPartnerSignals({
      products: [product(title)],
      sales: [sale(title, daysAgo(10))],
      now: NOW,
    });
    expect(signals.get("j1")).toBeUndefined();
  });

  it("aucun prix demandé pour un produit indisponible", () => {
    const signals = toPartnerSignals({
      products: [product("Nantes Domicile 2025-26 (XL)", { available: false })],
      sales: [],
      now: NOW,
    });
    expect(signals.get("j1")).toBeUndefined();
  });

  it("une vente déduite récente donne un signal de vente daté", () => {
    const signals = toPartnerSignals({
      products: [],
      sales: [sale("Nantes Domicile 2025-26 (XL)", daysAgo(30), 48)],
      now: NOW,
    });
    expect(signals.get("j1")).toEqual([
      {
        price: 48,
        type: "sold",
        source: "partner:leparcamaillots",
        condition: "MINT",
        date: daysAgo(30),
      },
    ]);
  });

  it("ignore une vente de plus de 180 jours", () => {
    const signals = toPartnerSignals({
      products: [],
      sales: [sale("Nantes Domicile 2025-26 (XL)", daysAgo(181))],
      now: NOW,
    });
    expect(signals.get("j1")).toBeUndefined();
  });

  it("ignore une boutique absente du registre", () => {
    const signals = toPartnerSignals({
      products: [product("Nantes Domicile 2025-26 (XL)", { shop: "inconnue" })],
      sales: [],
      now: NOW,
    });
    expect(signals.size).toBe(0);
  });
});
