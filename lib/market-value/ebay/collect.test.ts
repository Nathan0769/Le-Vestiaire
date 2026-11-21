import { describe, expect, it } from "vitest";
import type { EbayItem } from "./client";
import { collectEbayForJersey } from "./collect";

const jersey = { season: "2024-25", type: "HOME", club: { name: "Arsenal" } };
const item = (title: string, value = "40"): EbayItem => ({ title, price: { value, currency: "GBP" } });

describe("collectEbayForJersey", () => {
  it("passe à la formulation suivante tant qu'il reste moins de 5 annonces après tri", async () => {
    const calls: string[] = [];
    const search = async (_t: string, q: string) => {
      calls.push(q);
      // 1re formulation : 2 annonces valides seulement ; 2e : 6.
      return calls.length === 1
        ? [item("Arsenal 2024/25 home shirt"), item("Arsenal 2024/25 home shirt"), item("Chelsea 2024/25 home shirt")]
        : Array.from({ length: 6 }, () => item("Arsenal 24/25 home shirt"));
    };
    const res = await collectEbayForJersey("t", jersey, ["EBAY_GB"], undefined, search);
    expect(calls).toHaveLength(2);
    expect(res.agg?.sampleSize).toBe(6);
  });

  it("s'arrête à la première formulation qui donne 5 annonces", async () => {
    let n = 0;
    const search = async () => {
      n++;
      return Array.from({ length: 5 }, () => item("Arsenal 2024/25 home shirt"));
    };
    await collectEbayForJersey("t", jersey, ["EBAY_GB", "EBAY_FR"], undefined, search);
    expect(n).toBe(2); // un appel par marché
  });
});
