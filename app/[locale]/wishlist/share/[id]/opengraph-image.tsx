import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { SHARE_ID_LENGTH, getShareMeta } from "@/lib/wishlist-shares";

export const runtime = "nodejs";
// Liste vivante : l'aperçu suit les ajouts, sans régénérer à chaque partage.
export const revalidate = 600;
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Le Vestiaire";

interface OgProps {
  params: Promise<{ id: string; locale: string }>;
}

type OgTheme = "christmas" | "birthday" | "valentine" | "default";

// Couleurs pleines par thème (pas de dégradé) : fond, accent du titre, texte secondaire, points décoratifs.
const PALETTES: Record<OgTheme, { bg: string; accent: string; soft: string; dot: string; card: string }> = {
  christmas: { bg: "#0f3b2c", accent: "#f2c75c", soft: "#cfe3d8", dot: "#ffffff", card: "#ffffff" },
  birthday: { bg: "#1d2a5b", accent: "#ff9f80", soft: "#d5dbf5", dot: "#ffd166", card: "#ffffff" },
  valentine: { bg: "#7a1734", accent: "#ffd1dc", soft: "#f6cfd9", dot: "#ffffff", card: "#ffffff" },
  default: { bg: "#1e293b", accent: "#e8dcc4", soft: "#cbd5e1", dot: "#ffffff", card: "#ffffff" },
};

// Flocons (Noël) ou confettis : positions fixes, l'image est la même à chaque rendu.
const DOTS = [
  [40, 60, 6], [130, 520, 4], [250, 30, 5], [520, 590, 6], [610, 40, 4], [700, 600, 5],
  [1150, 40, 6], [1080, 590, 4], [1170, 330, 5], [30, 320, 4], [380, 570, 3], [860, 20, 4],
] as const;

/** Archivo gras depuis Google Fonts ; sans réseau, la police par défaut (maigre) prend le relais. */
async function loadBoldFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=Archivo:wght@800")).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OpengraphImage({ params }: OgProps) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Wishlist.liveShare.og" });
  const meta = id.length === SHARE_ID_LENGTH ? await getShareMeta(id) : null;

  const theme: OgTheme =
    (["christmas", "birthday", "valentine"] as const).find((th) => th === meta?.theme) ?? (meta ? "default" : "christmas");
  const p = PALETTES[theme];
  const name = meta?.username ? `@${meta.username}` : t("someone");
  const images = meta?.imageUrls ?? [];
  const bold = await loadBoldFont();
  const display = bold ? "Archivo" : undefined;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: p.bg, color: "white", position: "relative" }}>
        {DOTS.map(([x, y, r], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              background: p.dot,
              opacity: 0.35,
            }}
          />
        ))}

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: images.length > 0 ? 560 : 1200, padding: "0 70px", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: p.accent, letterSpacing: 4, textTransform: "uppercase", fontFamily: display }}>
            {t(`headline.${theme}`)}
          </div>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 800, lineHeight: 1.05, fontFamily: display }}>{t("from", { name })}</div>
          {meta && (
            <div style={{ display: "flex", fontSize: 30, color: p.soft }}>{t("jerseys", { count: meta.count })}</div>
          )}
          <div style={{ display: "flex", fontSize: 22, color: p.soft, marginTop: 26, opacity: 0.9 }}>{t("footer")}</div>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 800, color: p.accent, marginTop: 6, fontFamily: display }}>Le Vestiaire</div>
        </div>

        {images.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", alignContent: "center", width: 640, padding: "0 50px 0 10px", gap: 20 }}>
            {images.map((src, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  width: images.length === 1 ? 420 : 270,
                  height: images.length === 1 ? 420 : 255,
                  background: p.card,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={src}
                  width={images.length === 1 ? 380 : 230}
                  height={images.length === 1 ? 380 : 220}
                  style={{ objectFit: "contain" }}
                  alt=""
                />
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    { ...size, fonts: bold ? [{ name: "Archivo", data: bold, weight: 800, style: "normal" }] : undefined }
  );
}
