import { Vibrant } from "node-vibrant/node";
import sharp from "sharp";

export type MainColorSource =
  | "Vibrant"
  | "DarkVibrant"
  | "LightVibrant"
  | "Muted"
  | null;

export interface MainColorResult {
  color: string | null;
  source: MainColorSource;
}

const CASCADE: Exclude<MainColorSource, null>[] = [
  "Vibrant",
  "DarkVibrant",
  "LightVibrant",
  "Muted",
];

export async function extractMainColor(
  imageUrl: string
): Promise<MainColorResult> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const rawBuffer = Buffer.from(await response.arrayBuffer());

    // Re-encode en PNG pour que Vibrant (jimp 0.22) lise tout format source
    // (WebP, AVIF, etc.). Resize pour limiter memoire + accelerer quantization.
    const sampleBuffer = await sharp(rawBuffer)
      .resize({ width: 256, withoutEnlargement: true })
      .png()
      .toBuffer();

    const palette = await Vibrant.from(sampleBuffer).getPalette();

    for (const name of CASCADE) {
      const swatch = palette[name];
      if (swatch?.hex) {
        return { color: swatch.hex.toLowerCase(), source: name };
      }
    }

    return { color: null, source: null };
  } catch (err) {
    if (process.env.EXTRACT_DEBUG === "1") {
      console.error(
        `[extract] ${imageUrl}: ${err instanceof Error ? err.message : err}`
      );
    }
    return { color: null, source: null };
  }
}
