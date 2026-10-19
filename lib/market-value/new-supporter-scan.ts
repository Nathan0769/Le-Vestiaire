import { after } from "next/server";
import type { SupporterPlanResult } from "@/lib/sync-supporter-plan";
import { reportError } from "@/lib/report-error";
import { scanNewSupporterJerseys } from "./ebay/refresh";

/**
 * Au passage FREE → PRO, lance en arrière-plan le scan eBay des maillots du
 * nouveau Supporter, pour qu'il voie une cote tout de suite. À appeler depuis
 * une route (after() exige un contexte de requête, d'où l'absence d'appel dans
 * syncSupporterPlan, aussi utilisé par un script).
 */
export function scheduleNewSupporterScan(result: SupporterPlanResult | null): void {
  if (!result || result.previous === "PRO" || result.next !== "PRO") return;
  const { userId } = result;
  after(() =>
    scanNewSupporterJerseys(userId).catch((error) =>
      reportError("market-value.new-supporter-scan", error)
    )
  );
}
