import { Vibrant } from "node-vibrant/node";
import sharp from "sharp";

export type MainColorSource =
  | "Vibrant"
  | "DarkVibrant"
  | "LightVibrant"
  | "Muted"
  | "BlackJersey"
  | "WhiteJersey"
  | null;

export interface MainColorResult {
  color: string | null;
  source: MainColorSource;
}

const CASCADE: Exclude<
  MainColorSource,
  null | "BlackJersey" | "WhiteJersey"
>[] = ["Vibrant", "DarkVibrant", "LightVibrant", "Muted"];

const WHITE_COLLAR_LUM = 0.9;
const BLACK_PIXEL_LUM = 0.18;
const BLACK_DOMINANT_THRESHOLD = 0.5;

function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Echantillonne une bande fine de tissu juste sous le col, au centre. Cette
 * zone est presque toujours du tissu pur (au-dessus du sponsor central, et a
 * l ecart des manches). Utilise pour detecter les maillots blancs.
 */
async function getCollarStripDominant(
  rawBuffer: Buffer
): Promise<{ r: number; g: number; b: number } | null> {
  const meta = await sharp(rawBuffer).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w < 100 || h < 100) return null;

  const stripBuffer = await sharp(rawBuffer)
    .extract({
      left: Math.floor(w * 0.35),
      top: Math.floor(h * 0.22),
      width: Math.floor(w * 0.3),
      height: Math.floor(h * 0.1),
    })
    .resize({ width: 128 })
    .png()
    .toBuffer();

  const { dominant } = await sharp(stripBuffer).stats();
  return dominant;
}

/**
 * Compte la proportion de pixels noirs sur un crop central du maillot. Utilise
 * pour detecter les maillots noirs meme s ils ont un col / un lisere d une
 * autre couleur.
 */
async function blackPixelRatio(rawBuffer: Buffer): Promise<number> {
  const meta = await sharp(rawBuffer).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w < 80 || h < 80) return 0;

  const { data, info } = await sharp(rawBuffer)
    .extract({
      left: Math.floor(w * 0.25),
      top: Math.floor(h * 0.2),
      width: Math.floor(w * 0.5),
      height: Math.floor(h * 0.6),
    })
    .resize({ width: 128, withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const totalPixels = info.width * info.height;
  let blackPixels = 0;

  for (let i = 0; i < data.length; i += channels) {
    const lum = luminance(data[i], data[i + 1], data[i + 2]);
    if (lum < BLACK_PIXEL_LUM) blackPixels++;
  }

  return blackPixels / totalPixels;
}

export async function extractMainColor(
  imageUrl: string
): Promise<MainColorResult> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const rawBuffer = Buffer.from(await response.arrayBuffer());

    // Maillot blanc : bande tissu sous le col tres claire
    const collarDominant = await getCollarStripDominant(rawBuffer);
    if (collarDominant) {
      const collarLum = luminance(
        collarDominant.r,
        collarDominant.g,
        collarDominant.b
      );
      if (collarLum > WHITE_COLLAR_LUM) {
        return { color: "#fafafa", source: "WhiteJersey" };
      }
    }

    // Maillot noir : proportion de pixels noirs sur tout le maillot
    const blackRatio = await blackPixelRatio(rawBuffer);
    if (blackRatio >= BLACK_DOMINANT_THRESHOLD) {
      return { color: "#0a0a0a", source: "BlackJersey" };
    }

    // Sinon : pipeline Vibrant standard
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
