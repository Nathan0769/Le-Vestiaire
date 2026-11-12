/**
 * Envoie les images d'une annonce de nouveautés sur R2 `static`.
 *   pnpm exec tsx scripts/announcements/upload-images.ts <id-annonce> <dossier>
 * Chaque <dossier>/<carte>-web.jpg et <carte>-ios.jpg devient announcements/<id>/<fichier>, comme
 * déclaré dans lib/announcements/catalog.ts. Spec : docs/specs/2026-11-11-annonces-nouveautes.md.
 */
import { config } from "dotenv";
config({ path: ".env", quiet: true });

import { readdirSync, readFileSync } from "fs";
import path from "path";

async function main() {
  const [id, dir] = process.argv.slice(2);
  if (!id || !dir) throw new Error("usage : upload-images.ts <id-annonce> <dossier>");

  const { ANNOUNCEMENTS } = await import("@/lib/announcements/catalog");
  const { uploadToR2, getR2PublicUrl, STATIC_BUCKET } = await import("@/lib/r2-storage");
  const announcement = ANNOUNCEMENTS.find((a) => a.id === id);
  if (!announcement) throw new Error(`annonce inconnue : ${id}`);

  const expected = new Set(announcement.cards.flatMap((c) => (c.image ? [c.image.web, c.image.ios] : [])));
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".jpg"))) {
    const key = `announcements/${id}/${file}`;
    if (!expected.has(key)) throw new Error(`${file} ne correspond à aucune carte de ${id}`);
    await uploadToR2(STATIC_BUCKET, key, readFileSync(path.join(dir, file)), "image/jpeg");
    console.log(getR2PublicUrl(STATIC_BUCKET, key));
    expected.delete(key);
  }
  if (expected.size > 0) console.warn(`images manquantes : ${[...expected].join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
