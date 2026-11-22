import { describe, it, expect } from "vitest";
import { smoothEbay } from "./smoothing";

const day = 86_400_000;
const prev = (over = {}) => ({ medianPrice: 40, p25Price: 36, p75Price: 44, sampleSize: 20, methodVersion: 3, lastSeenAt: new Date(0), ...over });
const next = { medianPrice: 60, p25Price: 50, p75Price: 70 };

describe("smoothEbay", () => {
  it("sans précédent : valeurs du scan", () => {
    expect(smoothEbay(null, next, new Date(15 * day))).toEqual(next);
  });
  it("précédent de 15 jours : moitié-moitié", () => {
    expect(smoothEbay(prev(), next, new Date(15 * day))).toEqual({ medianPrice: 50, p25Price: 43, p75Price: 57 });
  });
  it("précédent de la veille : l'ancien pèse encore beaucoup", () => {
    expect(smoothEbay(prev(), next, new Date(1 * day)).medianPrice).toBeLessThan(42);
  });
  it("précédent de la méthode 1 ou sans annonce : ignoré", () => {
    expect(smoothEbay(prev({ methodVersion: 1 }), next, new Date(15 * day))).toEqual(next);
    expect(smoothEbay(prev({ sampleSize: 0 }), next, new Date(15 * day))).toEqual(next);
  });
});
