import { describe, it, expect } from "vitest";
import { classifySale, parseProductResearch, summarizeSales } from "./terapeak-classify";

const inter = { season: "2024-25", type: "HOME", club: { name: "Inter Milan" } };

// Titres de la séance Terapeak du 2026-11-21 (Inter Milan 2024/25 domicile).
describe("classifySale", () => {
  it.each([
    ["Nike Mens Inter Milan 2024 25 Stadium Home Football Shirt M", { kept: true, flocked: false, isNew: false }],
    ["Inter Milan 2024/25 Home Shirt Men’s XL BNWT", { kept: true, flocked: false, isNew: true }],
    ["Nike Inter Milan Home Shirt 2024/25 BNWT Black Blue Betsson Sport 2 Stars Mens", { kept: true, flocked: false, isNew: true }],
    ["2024/25 Inter Milan Home Jersey Lautaro #10 Nike Dri-FIT M Shirt-Scudetto Badge", { kept: true, flocked: true, isNew: false }],
    ["Nike Inter Milan 2024/25 home jersey Size L - AUTHENTIC #football #soccer #BNWT", { kept: true, flocked: false, isNew: true }],
  ])("%s", (title, expected) => {
    expect(classifySale(title, inter)).toEqual(expected);
  });

  it.each([
    ["DAVID BECKHAM & LIONEL MESSI SIGNED INTER MILAN CF 2024-25 HOME SHIRT ICONS COA", "noise"],
    ["Nike Inter Milan Men's Home Player Issue Jersey Size Medium Season 2024/25", "noise"],
    ["BNWT Original Inter Milan 2024/25 Home Football Shirt Nike Drifit ADV XXL", "version"],
    ["Inter Milan Childs 2024/25 home Football Shirt  Size 12/13 yrs Mintcon", "kids"],
  ])("%s -> écarté (%s)", (title, reason) => {
    expect(classifySale(title, inter)).toEqual({ kept: false, reason });
  });
});

describe("parseProductResearch / summarizeSales", () => {
  const raw = [
    "Inter Milan 2024/25 Home Shirt Men’s XL BNWT",
    ", preview full size image",
    "Inter Milan 2024/25 Home Shirt Men’s XL BNWT",
    "Edit",
    "",
    "£39.22",
    "Fixed price",
    "£3.65",
    "0% free postage",
    "1",
    "£39.22",
    "–",
    "4 Aug 2025",
    "Nike Mens Inter Milan 2024 25 Stadium Home Football Shirt M, preview full size image",
    "Nike Mens Inter Milan 2024 25 Stadium Home Football Shirt M",
    "Edit",
    "",
    "£30.81",
    "Fixed price",
    "£0.00",
    "100% free postage",
    "2",
    "£61.63",
    "–",
    "23 Jul 2026",
  ].join("\n");

  it("lit titre, prix et quantité", () => {
    expect(parseProductResearch(raw)).toEqual([
      { title: "Inter Milan 2024/25 Home Shirt Men’s XL BNWT", price: 39.22, format: "Fixed price", qty: 1 },
      { title: "Nike Mens Inter Milan 2024 25 Stadium Home Football Shirt M", price: 30.81, format: "Fixed price", qty: 2 },
    ]);
  });

  it("compte chaque vente d'une ligne et ramène le neuf à l'état GOOD", () => {
    const s = summarizeSales(parseProductResearch(raw), inter);
    expect(s.count).toBe(3);
    expect(s.worn).toEqual([30.81, 30.81]);
    expect(s.goodEquivalent).toBe(30.81);
  });
});
