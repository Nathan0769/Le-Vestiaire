import { describe, it, expect, vi, beforeEach } from "vitest";

// Seuls le réseau et Redis sont simulés : la logique de conversion est réelle.
const redisStore = new Map<string, unknown>();
const redisGet = vi.fn(async (key: string) => redisStore.get(key) ?? null);
vi.mock("@/lib/redis", () => ({
  redis: {
    get: (key: string) => redisGet(key),
    set: vi.fn(async (key: string, value: unknown) => {
      redisStore.set(key, value);
      return "OK";
    }),
  },
}));

const fetchMock = vi.fn();

// Module rechargé à chaque test : le cache mémoire repart de zéro.
async function loadFx() {
  vi.resetModules();
  return import("@/lib/fx");
}

beforeEach(() => {
  redisStore.clear();
  redisGet.mockClear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("getRatesToEur", () => {
  it("inverse les taux EUR->X de l'API en X->EUR", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ rates: { BRL: 5.5, USD: 1.1 } }), { status: 200 })
    );
    const { getRatesToEur } = await loadFx();
    const rates = await getRatesToEur();
    expect(rates.EUR).toBe(1);
    expect(rates.BRL).toBeCloseTo(1 / 5.5);
    expect(rates.USD).toBeCloseTo(1 / 1.1);
  });

  it("se replie sur les taux statiques, BRL compris, si l'API échoue", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 500 }));
    const { getRatesToEur, FX_FALLBACK_RATES } = await loadFx();
    const rates = await getRatesToEur();
    expect(rates).toEqual(FX_FALLBACK_RATES);
    expect(rates.BRL).toBeGreaterThan(0);
  });

  it("sert le cache Redis sans appeler l'API", async () => {
    redisStore.set("fx:to-eur:v2", { EUR: 1, BRL: 0.2 });
    const { getRatesToEur } = await loadFx();
    const rates = await getRatesToEur();
    expect(rates.BRL).toBe(0.2);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sert le deuxième appel depuis la mémoire, sans Redis ni réseau", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ rates: { BRL: 5.5 } }), { status: 200 })
    );
    const { getRatesToEur } = await loadFx();
    await getRatesToEur();
    await getRatesToEur();
    expect(redisGet).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
