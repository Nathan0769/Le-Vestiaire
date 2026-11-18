import { describe, expect, it } from "vitest";
import { needsCustomIosBanner } from "@/lib/ios-app-banner-target";

const UA = {
  safariIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  chromeIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1",
  firefoxIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/132.0 Mobile/15E148 Safari/605.1.15",
  edgeIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 EdgiOS/131.0.2903.68 Mobile/15E148 Safari/605.1.15",
  googleAppIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/343.0.695551749 Mobile/15E148 Safari/604.1",
  instagramIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 357.0.0.25.101 (iPhone15,2; iOS 18_1; fr_FR; fr; scale=3.00; 1179x2556)",
  facebookIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/489.0.0.45.108;FBBV/650000000;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/18.1;FBSS/3;FBLC/fr_FR]",
  duckduckgoIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 DuckDuckGo/7 Safari/605.1.15",
  safariIpad:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  chromeIpad:
    "Mozilla/5.0 (iPad; CPU OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1",
  safariMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
  chromeDesktop:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

describe("needsCustomIosBanner", () => {
  it("laisse Safari iPhone à la bannière native", () => {
    expect(needsCustomIosBanner(UA.safariIphone, 5)).toBe(false);
  });

  it("laisse Safari iPad (UA de Mac, écran tactile) à la bannière native", () => {
    expect(needsCustomIosBanner(UA.safariIpad, 5)).toBe(false);
  });

  it.each([
    ["Chrome iPhone", UA.chromeIphone],
    ["Firefox iPhone", UA.firefoxIphone],
    ["Edge iPhone", UA.edgeIphone],
    ["appli Google", UA.googleAppIphone],
    ["navigateur Instagram", UA.instagramIphone],
    ["navigateur Facebook", UA.facebookIphone],
    ["DuckDuckGo iPhone", UA.duckduckgoIphone],
    ["Chrome iPad", UA.chromeIpad],
  ])("affiche le bandeau sur %s, sans bannière native", (_name, ua) => {
    expect(needsCustomIosBanner(ua, 5)).toBe(true);
  });

  it.each([
    ["Safari Mac", UA.safariMac, 0],
    ["Chrome Android", UA.chromeAndroid, 5],
    ["Chrome ordinateur", UA.chromeDesktop, 0],
  ])("n'affiche rien hors iOS : %s", (_name, ua, touchPoints) => {
    expect(needsCustomIosBanner(ua, touchPoints)).toBe(false);
  });
});
