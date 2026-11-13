import { describe, it, expect } from "vitest";
import { parseTapfiliatePostback } from "@/lib/affiliate-postback";

const params = (entries: Record<string, string>) => new URLSearchParams(entries);

describe("parseTapfiliatePostback", () => {
  it("lit une conversion complète et son emplacement", () => {
    const row = parseTapfiliatePostback(
      params({
        program_id: "classic-football-shirts",
        conversion_id: "conv_123",
        conversion_amount: "121.94",
        commission_amount: "12.19",
        currency: "GBP",
        conversion_status: "pending",
        conversion_time: "2026-11-05T10:12:00+00:00",
        click_subid: "fiche-cmjersey1",
        click_time: "2026-11-05T09:58:00+00:00",
      })
    );
    expect(row).toEqual({
      network: "tapfiliate",
      conversionId: "conv_123",
      programId: "classic-football-shirts",
      amount: 121.94,
      commission: 12.19,
      currency: "GBP",
      status: "pending",
      subId: "fiche-cmjersey1",
      placement: "fiche",
      targetId: "cmjersey1",
      clickedAt: new Date("2026-11-05T09:58:00Z"),
      convertedAt: new Date("2026-11-05T10:12:00Z"),
    });
  });

  it("refuse une conversion sans identifiant", () => {
    expect(parseTapfiliatePostback(params({ conversion_amount: "10" }))).toBeNull();
  });

  it("ignore un montant ou une date illisible, et une variable non remplacée", () => {
    const row = parseTapfiliatePostback(
      params({
        conversion_id: "conv_1",
        conversion_amount: "abc",
        conversion_time: "pas une date",
        click_subid: "${click_subid}",
      })
    );
    expect(row).toMatchObject({ amount: null, convertedAt: null, subId: null, placement: null });
  });
});
