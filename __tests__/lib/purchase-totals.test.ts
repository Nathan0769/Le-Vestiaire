import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { priceEur, sumPurchasesEur } from "@/lib/purchase-totals";

const RATES = { EUR: 1, BRL: 0.2 };

describe("priceEur", () => {
  it("convertit un prix d'achat en EUR selon sa devise", () => {
    expect(priceEur({ purchasePrice: 1000, purchaseCurrency: "BRL" }, RATES)).toBeCloseTo(200);
  });

  it("accepte un Decimal Prisma", () => {
    expect(
      priceEur({ purchasePrice: new Prisma.Decimal("49.90"), purchaseCurrency: "EUR" }, RATES)
    ).toBeCloseTo(49.9);
  });

  it("renvoie null sans prix", () => {
    expect(priceEur({ purchasePrice: null, purchaseCurrency: "EUR" }, RATES)).toBeNull();
  });
});

describe("sumPurchasesEur", () => {
  it("additionne des prix de devises différentes en EUR", () => {
    const total = sumPurchasesEur(
      [
        { purchasePrice: 100, purchaseCurrency: "EUR" },
        { purchasePrice: 1000, purchaseCurrency: "BRL" },
      ],
      RATES
    );
    expect(total).toBeCloseTo(300);
  });

  it("ignore les prix absents", () => {
    const total = sumPurchasesEur(
      [
        { purchasePrice: null, purchaseCurrency: "EUR" },
        { purchasePrice: 80, purchaseCurrency: "EUR" },
      ],
      RATES
    );
    expect(total).toBe(80);
  });

  it("ignore une devise sans taux plutôt que de la compter 1:1", () => {
    const total = sumPurchasesEur(
      [
        { purchasePrice: 10000, purchaseCurrency: "JPY" },
        { purchasePrice: 50, purchaseCurrency: "EUR" },
      ],
      RATES
    );
    expect(total).toBe(50);
  });
});
