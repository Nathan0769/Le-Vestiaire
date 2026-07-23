import { describe, it, expect, vi } from "vitest";
import { createProgressCache } from "./progress-cache";

describe("createProgressCache", () => {
  it("ne calcule qu'une fois par fonction pour un même user", async () => {
    const fn = vi.fn(async () => 5);
    const getProgress = createProgressCache("u1");

    const [a, b] = await Promise.all([getProgress(fn), getProgress(fn)]);

    expect(a).toBe(5);
    expect(b).toBe(5);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("recalcule pour des fonctions différentes", async () => {
    const f1 = vi.fn(async () => 1);
    const f2 = vi.fn(async () => 2);
    const getProgress = createProgressCache("u1");

    expect(await getProgress(f1)).toBe(1);
    expect(await getProgress(f2)).toBe(2);
    expect(f1).toHaveBeenCalledTimes(1);
    expect(f2).toHaveBeenCalledTimes(1);
  });

  it("passe le userId à la fonction", async () => {
    const fn = vi.fn(async (id: string) => id.length);
    const getProgress = createProgressCache("abc");

    expect(await getProgress(fn)).toBe(3);
    expect(fn).toHaveBeenCalledWith("abc");
  });
});
