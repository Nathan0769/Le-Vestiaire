import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseTapfiliatePostback } from "@/lib/affiliate-postback";
import { checkRateLimit, generousRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

const sha256 = (value: string) => createHash("sha256").update(value).digest();

// Comparaison à temps constant (hachés de même longueur) : la durée ne renseigne pas sur le secret.
function tokenMatches(token: string | null, secret: string): boolean {
  return token !== null && timingSafeEqual(sha256(token), sha256(secret));
}

/**
 * Postback Tapfiliate : une requête par conversion CFS (création ou changement
 * de statut). Spec : docs/specs/2026-11-09-ventes-affiliees-cfs.md.
 */
export async function GET(request: Request) {
  const secret = process.env.TAPFILIATE_POSTBACK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Postback non configuré" }, { status: 503 });
  }

  const rateLimitResult = await checkRateLimit(generousRateLimit, await getRateLimitIdentifier());
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const params = new URL(request.url).searchParams;
  if (!tokenMatches(params.get("token"), secret)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const row = parseTapfiliatePostback(params);
  if (!row) {
    return NextResponse.json({ error: "conversion_id manquant" }, { status: 400 });
  }

  try {
    const { network, conversionId, ...fields } = row;
    // Un changement de statut peut arriver sans tous les champs : on garde ceux déjà reçus.
    const update = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== null));
    await prisma.affiliateConversion.upsert({
      where: { network_conversionId: { network, conversionId } },
      create: row,
      update,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[affiliate/tapfiliate]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
