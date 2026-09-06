/**
 * Compresse/redimensionne une image cote client avant upload.
 *
 * Deux objectifs :
 * 1. Rester sous la limite Vercel (~4.5MB de corps de requete serverless,
 *    FUNCTION_PAYLOAD_TOO_LARGE au-dela).
 * 2. Limiter le poids stocke sur R2 (couts de stockage).
 *
 * Sortie en WebP (25-35% plus leger que le JPEG a qualite egale, decodable par
 * tous les navigateurs modernes), avec repli JPEG si l'encodage WebP n'est pas
 * supporte (vieux Safari).
 *
 * L'entree doit etre un format decodable par le navigateur (JPEG/PNG/WebP) :
 * convertir le HEIC via convertHeicToJpeg AVANT.
 */

type CompressOptions = {
  /** Dimension max (largeur ou hauteur) du cote long, en px. */
  maxDimension?: number;
  /** Taille cible max en octets. */
  maxBytes?: number;
  /** Qualite d'encodage initiale (0-1). */
  quality?: number;
};

const DEFAULT_MAX_DIMENSION = 2000;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const DEFAULT_QUALITY = 0.85;
const MIN_QUALITY = 0.5;

let webpSupport: boolean | null = null;

/** Le navigateur sait-il encoder du WebP via canvas ? (memoise) */
function supportsWebp(): boolean {
  if (webpSupport !== null) return webpSupport;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  webpSupport = canvas
    .toDataURL("image/webp")
    .startsWith("data:image/webp");
  return webpSupport;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxDimension = DEFAULT_MAX_DIMENSION,
    maxBytes = DEFAULT_MAX_BYTES,
    quality = DEFAULT_QUALITY,
  } = options;

  const mimeType = supportsWebp() ? "image/webp" : "image/jpeg";
  const extension = mimeType === "image/webp" ? "webp" : "jpg";

  const bitmap = await createImageBitmap(file);

  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height)
  );
  const targetWidth = Math.round(bitmap.width * scale);
  const targetHeight = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  let currentQuality = quality;
  let blob = await canvasToBlob(canvas, mimeType, currentQuality);

  // Baisse la qualite par paliers tant qu'on depasse la cible.
  while (blob.size > maxBytes && currentQuality > MIN_QUALITY) {
    currentQuality = Math.max(MIN_QUALITY, currentQuality - 0.1);
    blob = await canvasToBlob(canvas, mimeType, currentQuality);
  }

  const name = file.name.replace(/\.[^.]+$/, "") + "." + extension;
  return new File([blob], name, { type: mimeType });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Echec de la compression de l'image"));
      },
      mimeType,
      quality
    );
  });
}
