import { NextResponse } from "next/server";

// Temporaire (phase 0 du spec boutiques partenaires) : vérifie si le catalogue
// Shopify répond depuis les IP Vercel. A supprimer après le test.
export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const res = await fetch("https://leparcamaillots.com/products.json?limit=1", {
    headers: {
      "User-Agent": "LeVestiaireBot (+https://le-vestiaire-foot.fr)",
      Accept: "application/json",
    },
    cache: "no-store",
  });
  const body = await res.text();

  return NextResponse.json({
    status: res.status,
    contentType: res.headers.get("content-type"),
    isJson: body.trimStart().startsWith("{"),
    region: process.env.VERCEL_REGION ?? null,
  });
}
