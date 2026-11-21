import { describe, it, expect } from "vitest";
import { chainSnapshots } from "./method-chain";

const s = (value: number, day: number, methodVersion: number) => ({ value, time: day * 86_400_000, methodVersion });

describe("chainSnapshots", () => {
  it("ramène l'ancienne méthode au niveau de la nouvelle au point de raccord", () => {
    const out = chainSnapshots([s(40, 1, 1), s(44, 2, 1), s(22, 3, 2), s(23, 4, 2)]);
    // v1 × (22 / 44) : 40 -> 20, 44 -> 22
    expect(out.map((x) => x.value)).toEqual([20, 22, 22, 23]);
  });

  it("sans changement de méthode, rien ne bouge", () => {
    const out = chainSnapshots([s(40, 1, 2), s(44, 2, 2)]);
    expect(out.map((x) => x.value)).toEqual([40, 44]);
  });

  it("enchaîne plusieurs changements depuis le plus récent", () => {
    // v1 [10] -> v2 [20] -> v3 [5] : v2 × 5/20, v1 × (20/10) × (5/20)
    const out = chainSnapshots([s(10, 1, 1), s(20, 2, 2), s(5, 3, 3)]);
    expect(out.map((x) => x.value)).toEqual([5, 5, 5]);
  });
});
