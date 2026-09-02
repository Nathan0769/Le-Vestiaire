import { NextResponse } from "next/server";

/**
 * Apple App Site Association (AASA).
 * `webcredentials` associe l'app iOS au domaine pour l'autofill / la sauvegarde
 * des mots de passe forts dans le trousseau iCloud (Associated Domains).
 * App identifier = <TeamID>.<BundleID>.
 * Servi sur https://le-vestiaire-foot.fr/.well-known/apple-app-site-association
 */
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    webcredentials: {
      apps: ["A6282F28YY.fr.levestiaire.app"],
    },
  });
}
