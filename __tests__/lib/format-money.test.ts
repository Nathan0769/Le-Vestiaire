import { describe, it, expect } from "vitest";
import { formatMoney } from "@/lib/format-money";

// Intl insère des espaces insécables : on les normalise pour comparer.
const plain = (s: string) => s.replace(/ | /g, " ");

describe("formatMoney", () => {
  it("affiche le symbole de la devise", () => {
    expect(plain(formatMoney(1000, "BRL", "pt"))).toContain("R$");
  });

  it("garde les centimes quand il y en a", () => {
    expect(plain(formatMoney(19.5, "EUR", "fr"))).toBe("19,50 €");
  });

  it("n'affiche pas de décimales pour un montant rond", () => {
    expect(plain(formatMoney(20, "EUR", "fr"))).toBe("20 €");
  });

  it("arrondit au centime avant de choisir le format (19,999 -> 20)", () => {
    expect(plain(formatMoney(19.999, "EUR", "fr"))).toBe("20 €");
  });

  it("se replie sur EUR pour une devise invalide", () => {
    expect(plain(formatMoney(10, "???", "fr"))).toBe("10 €");
  });
});
