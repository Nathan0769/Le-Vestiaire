import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/check-permission";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import { getCohortUsers, getMetricUsers, pickActivitySource } from "@/lib/admin/kpi";
import { CHART_METRICS } from "@/types/admin-kpi";

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const platform = z.enum(["all", "ios", "web"]).default("all");

// Soit un point du graphique (métrique + jour), soit une cellule de cohorte
const querySchema = z.union([
  z.object({ metric: z.enum(CHART_METRICS), day: isoDay, platform }),
  z.object({ cohort: isoDay, offset: z.coerce.number().int().min(0).max(8), platform }),
]);

/**
 * GET /api/admin/kpi/users
 * Utilisateurs derrière un point du dashboard KPI (100 max, sans email).
 * Réservé aux admins
 */
export async function GET(request: Request) {
  const { error, session } = await requirePermission(undefined, true);
  if (error) return error;

  const identifier = await getRateLimitIdentifier(session!.user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  try {
    const source = await pickActivitySource();
    const query = parsed.data;
    const users =
      "metric" in query
        ? await getMetricUsers({ metric: query.metric, day: query.day, platform: query.platform, source })
        : await getCohortUsers({
            cohortWeek: query.cohort,
            offset: query.offset,
            platform: query.platform,
            source,
          });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("❌ Erreur lors du détail KPI:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du détail" },
      { status: 500 }
    );
  }
}
