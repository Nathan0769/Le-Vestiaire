import { describe, it, expect } from "vitest";
import { isSupportedCurrency, currencyForCountry, toEur, fromEur } from "@/lib/currency";

const RATES = { EUR: 1, BRL: 0.18 };

describe("isSupportedCurrency", () => {
  it("accepte un code ISO publié par la BCE", () => {
    expect(isSupportedCurrency("BRL")).toBe(true);
    expect(isSupportedCurrency("EUR")).toBe(true);
  });

  it("refuse un code en minuscules, inconnu ou non textuel", () => {
    expect(isSupportedCurrency("brl")).toBe(false);
    expect(isSupportedCurrency("XYZ")).toBe(false);
    expect(isSupportedCurrency(123)).toBe(false);
    expect(isSupportedCurrency(null)).toBe(false);
  });
});

describe("currencyForCountry", () => {
  it("donne la devise du pays", () => {
    expect(currencyForCountry("BR")).toBe("BRL");
    expect(currencyForCountry("FR")).toBe("EUR");
    expect(currencyForCountry("US")).toBe("USD");
    expect(currencyForCountry("GB")).toBe("GBP");
    expect(currencyForCountry("CH")).toBe("CHF");
  });

  it("se replie sur EUR pour un pays inconnu ou absent", () => {
    expect(currencyForCountry("ZZ")).toBe("EUR");
    expect(currencyForCountry(null)).toBe("EUR");
    expect(currencyForCountry(undefined)).toBe("EUR");
  });
});

describe("toEur", () => {
  it("convertit avec le taux vers EUR", () => {
    expect(toEur(100, "BRL", RATES)).toBeCloseTo(18);
  });

  it("laisse un montant EUR tel quel", () => {
    expect(toEur(100, "EUR", RATES)).toBe(100);
  });

  it("renvoie null sans taux plutôt que de compter 1:1", () => {
    expect(toEur(100, "JPY", { EUR: 1 })).toBeNull();
  });
});

describe("fromEur", () => {
  it("convertit un montant EUR vers la devise", () => {
    expect(fromEur(18, "BRL", RATES)).toBeCloseTo(100);
  });

  it("renvoie null sans taux", () => {
    expect(fromEur(18, "JPY", { EUR: 1 })).toBeNull();
  });
});
