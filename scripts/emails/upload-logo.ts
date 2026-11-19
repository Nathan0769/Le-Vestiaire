/**
 * Envoie le logo des e-mails sur R2 `static` (logo-app/logo-email.png), lu par
 * EMAIL_LOGO_URL (emails/reminder-no-jersey.tsx). PNG : le SVG et le WebP ne
 * s'affichent pas partout (Gmail, Outlook).
 *   pnpm exec tsx scripts/emails/upload-logo.ts <fichier.png>
 */
import { config } from "dotenv";
config({ path: ".env", quiet: true });

import { readFileSync } from "fs";

async function main() {
  const [file] = process.argv.slice(2);
  if (!file?.endsWith(".png")) throw new Error("usage : upload-logo.ts <fichier.png>");

  const { uploadToR2, getR2PublicUrl, STATIC_BUCKET } = await import("@/lib/r2-storage");
  const key = "logo-app/logo-email.png";
  await uploadToR2(STATIC_BUCKET, key, readFileSync(file), "image/png");
  console.log(getR2PublicUrl(STATIC_BUCKET, key));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
