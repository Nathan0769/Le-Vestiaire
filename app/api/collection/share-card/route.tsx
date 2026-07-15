import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import sharp from "sharp";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import {
  standardRateLimit,
  getRateLimitIdentifier,
  checkRateLimit,
} from "@/lib/rate-limit";
import {
  getR2PresignedUrl,
  AVATARS_BUCKET,
  USER_JERSEY_PHOTOS_BUCKET,
} from "@/lib/r2-storage";
import {
  selectTopJerseys,
  type TopJerseyInput,
} from "@/lib/collection-share/select-top-jerseys";
import { computeCollectionStats } from "@/lib/collection-share/stats";

export const runtime = "nodejs";

const SIZES = {
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1080 },
  tweet: { width: 1200, height: 675 },
} as const;

type FormatKey = keyof typeof SIZES;
type StatKey = "clubs" | "leagues" | "countries" | "value";
const ALL_STATS: StatKey[] = ["clubs", "leagues", "countries", "value"];

const querySchema = z.object({
  type: z.enum(["stats", "top", "recent"]),
  format: z.enum(["story", "post", "tweet"]).default("story"),
  stats: z.string().optional(),
  count: z.coerce.number().int().refine((v) => v === 3 || v === 6).default(6),
  showAvatar: z.enum(["true", "false"]).default("true"),
  showUsername: z.enum(["true", "false"]).default("true"),
});

// Timings
const PRESIGNED_URL_TTL_S = 3600; // 1h, matches downstream cache header
const IMAGE_FETCH_TIMEOUT_MS = 6000;

// Image sizing
const INLINED_IMAGE_MAX_PX = 400;

// Card limits
const MAX_TOP_CLUBS = 3;

// Palette
const STORY_BG = "#12121c";
const CARD_BG =
  "linear-gradient(155deg, #2a2a3d 0%, #1e1e2e 55%, #181824 100%)";
const CARD_BORDER = "1px solid rgba(255,255,255,0.10)";
const CHIP_BG =
  "linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)";
const CHIP_BORDER = "1px solid rgba(255,255,255,0.14)";
const ACCENT = "#3b82f6";
const ACCENT_SOFT = "rgba(59,130,246,0.28)";
const TEXT_SECONDARY = "#a0a0b5";
const LOGO_URL =
  "https://pub-ad003198168b4f5c8a2c78eb57da8afd.r2.dev/logo-app/logo.png";
const SITE_URL = "https://le-vestiaire-foot.fr";

// Redact query string from URLs before logging: presigned URLs carry auth
// signatures that must not leak into logs.
function safeLogUrl(url: string): string {
  const q = url.indexOf("?");
  return q === -1 ? url : url.slice(0, q);
}

async function generateHomeQr(): Promise<string> {
  return QRCode.toDataURL(SITE_URL, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 240,
    color: { dark: "#0a0a12", light: "#ffffff" },
  });
}

// Fetch a remote image, re-encode as PNG via sharp, return as base64 data URI.
// Two problems solved:
//  1. Satori's concurrent image fetching drops requests past ~5 parallel calls,
//     which was making the 6th jersey render empty.
//  2. Satori's image decoder can crash ("u2 is not iterable") on some formats
//     it received directly (WebP variants, unusual PNG encodings). Forcing
//     everything through sharp → PNG guarantees compatibility.
// Also resizes to 400x400 to keep the payload small enough to embed 6 images
// inline without ballooning response size.
async function fetchImageAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(
        `share-card: image fetch ${res.status} for ${safeLogUrl(url)}`,
      );
      return null;
    }
    const rawType = (res.headers.get("content-type") ?? "").toLowerCase();
    if (!rawType.startsWith("image/")) {
      console.warn(
        `share-card: non-image content-type "${rawType}" for ${safeLogUrl(url)}`,
      );
      return null;
    }
    const srcBuf = Buffer.from(await res.arrayBuffer());
    if (srcBuf.byteLength === 0) return null;

    const pngBuf = await sharp(srcBuf)
      .resize(INLINED_IMAGE_MAX_PX, INLINED_IMAGE_MAX_PX, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    return `data:image/png;base64,${pngBuf.toString("base64")}`;
  } catch (err) {
    console.warn(
      `share-card: image processing failed for ${safeLogUrl(url)}`,
      err,
    );
    return null;
  }
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const identifier = await getRateLimitIdentifier(user.id);
  const rateLimitResult = await checkRateLimit(standardRateLimit, identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    type: searchParams.get("type") ?? undefined,
    format: searchParams.get("format") ?? undefined,
    stats: searchParams.get("stats") ?? undefined,
    count: searchParams.get("count") ?? undefined,
    showAvatar: searchParams.get("showAvatar") ?? undefined,
    showUsername: searchParams.get("showUsername") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }
  const {
    type,
    format,
    stats: statsParam,
    count,
    showAvatar,
    showUsername,
  } = parsed.data;

  const enabledStats = new Set<StatKey>(
    statsParam
      ? (statsParam.split(",").filter((s): s is StatKey =>
          (ALL_STATS as string[]).includes(s),
        ) as StatKey[])
      : ALL_STATS,
  );

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { username: true, name: true, avatar: true },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const avatarUrl =
    showAvatar === "true" && dbUser.avatar
      ? await getR2PresignedUrl(AVATARS_BUCKET, dbUser.avatar, PRESIGNED_URL_TTL_S)
      : null;

  const usernameForCard = showUsername === "true" ? dbUser.username : null;
  const qrDataUri = await generateHomeQr();

  const commonProps = {
    avatarUrl,
    username: usernameForCard,
    format,
    logoUrl: LOGO_URL,
    qrDataUri,
  };

  const headers = { "Cache-Control": "private, max-age=60" };
  const size = SIZES[format];

  if (type === "stats") {
    const items = await prisma.userJersey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        purchasePrice: true,
        jersey: {
          select: {
            club: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                league: { select: { id: true, country: true } },
              },
            },
          },
        },
      },
    });

    const stats = computeCollectionStats(
      items.map((i) => ({
        id: i.id,
        purchasePrice: i.purchasePrice ? Number(i.purchasePrice) : null,
        jersey: i.jersey,
      })),
    );

    const clubCounts = new Map<
      string,
      { id: string; name: string; logoUrl: string; count: number }
    >();
    for (const item of items) {
      const club = item.jersey.club;
      const existing = clubCounts.get(club.id);
      if (existing) existing.count += 1;
      else
        clubCounts.set(club.id, {
          id: club.id,
          name: club.name,
          logoUrl: club.logoUrl,
          count: 1,
        });
    }
    const topClubsRaw = Array.from(clubCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_TOP_CLUBS);
    const topClubs = await Promise.all(
      topClubsRaw.map(async (c) => ({
        id: c.id,
        name: c.name,
        count: c.count,
        logoDataUri: await fetchImageAsDataUri(c.logoUrl),
      })),
    );

    return new ImageResponse(
      renderStatsCard({ stats, enabledStats, topClubs, ...commonProps }),
      { ...size, headers },
    );
  }

  const rawItems = await prisma.userJersey.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      pinnedAt: true,
      createdAt: true,
      jerseyId: true,
      userPhotoUrl: true,
      jersey: {
        select: {
          imageUrl: true,
          club: { select: { name: true } },
        },
      },
    },
    ...(type === "recent"
      ? { orderBy: { createdAt: "desc" as const }, take: count }
      : {}),
  });

  let selected: typeof rawItems = rawItems;

  if (type === "top") {
    const ratings = await prisma.rating.findMany({
      where: {
        userId: user.id,
        jerseyId: { in: rawItems.map((i) => i.jerseyId) },
      },
      select: { jerseyId: true, rating: true },
    });
    const ratingByJersey = new Map(
      ratings.map((r) => [r.jerseyId, Number(r.rating)]),
    );
    const inputs: (TopJerseyInput & { source: (typeof rawItems)[number] })[] =
      rawItems.map((item) => ({
        id: item.id,
        pinnedAt: item.pinnedAt,
        createdAt: item.createdAt,
        userRating: ratingByJersey.get(item.jerseyId) ?? null,
        source: item,
      }));
    selected = selectTopJerseys(inputs)
      .slice(0, count)
      .map((i) => i.source);
  } else if (type === "recent") {
    selected = rawItems.slice(0, count);
  }

  const withResolvedImages = await Promise.all(
    selected.map(async (item) => {
      const remoteUrl = item.userPhotoUrl
        ? await getR2PresignedUrl(
            USER_JERSEY_PHOTOS_BUCKET,
            item.userPhotoUrl,
            PRESIGNED_URL_TTL_S,
          )
        : item.jersey.imageUrl;
      const imageUrl = await fetchImageAsDataUri(remoteUrl);
      return {
        id: item.id,
        imageUrl,
        clubName: item.jersey.club.name,
      };
    }),
  );

  const subtitle = type === "top" ? "MA SÉLECTION" : "DERNIÈRES ACQUISITIONS";

  return new ImageResponse(
    renderJerseysCard({
      jerseys: withResolvedImages,
      subtitle,
      ...commonProps,
    }),
    { ...size, headers },
  );
}

interface HeaderProps {
  avatarUrl: string | null;
  username: string | null;
  format: FormatKey;
}

function CardHeader({ avatarUrl, username, format }: HeaderProps) {
  const avatarSize = format === "tweet" ? 44 : 56;
  const usernameFontSize = format === "tweet" ? 22 : 28;

  // Always return a wrapper so the parent `justify-content: space-between`
  // layout stays predictable (Satori sometimes chokes when a child is null).
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        minHeight: avatarSize,
      }}
    >
      {avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          width={avatarSize}
          height={avatarSize}
          style={{
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid rgba(255,255,255,0.15)",
          }}
          alt=""
        />
      )}
      {username && (
        <div
          style={{
            display: "flex",
            fontSize: usernameFontSize,
            fontWeight: 600,
            color: "white",
          }}
        >
          @{username}
        </div>
      )}
    </div>
  );
}

interface CardFooterProps {
  format: FormatKey;
  logoUrl: string | null;
  qrDataUri: string;
}

function CardFooter({ format, logoUrl, qrDataUri }: CardFooterProps) {
  const brandFontSize = format === "tweet" ? 28 : 40;
  const logoSize = format === "tweet" ? 42 : 60;
  const tagFontSize = format === "tweet" ? 18 : 24;
  const qrSize = format === "tweet" ? 80 : 120;
  const scanHintSize = format === "tweet" ? 13 : 18;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        gap: 20,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "white",
            fontWeight: 700,
            fontSize: brandFontSize,
            letterSpacing: -0.5,
          }}
        >
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              width={logoSize}
              height={logoSize}
              style={{ borderRadius: 8 }}
              alt=""
            />
          )}
          Le Vestiaire
        </div>
        <div
          style={{
            fontSize: tagFontSize,
            color: TEXT_SECONDARY,
            display: "flex",
            letterSpacing: 2,
          }}
        >
          LE-VESTIAIRE-FOOT.FR
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            background: "white",
            borderRadius: 12,
            padding: 8,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUri}
            width={qrSize}
            height={qrSize}
            style={{ display: "block" }}
            alt=""
          />
        </div>
        <div
          style={{
            fontSize: scanHintSize,
            color: TEXT_SECONDARY,
            display: "flex",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Scanne-moi
        </div>
      </div>
    </div>
  );
}

function InnerCard({
  format,
  children,
}: {
  format: FormatKey;
  children: React.ReactNode;
}) {
  const outerPadding =
    format === "story"
      ? "60px 50px"
      : format === "post"
        ? "40px 40px"
        : "24px 40px";
  const cardPadding =
    format === "story" ? "50px 40px" : format === "post" ? "40px 30px" : "24px 32px";
  const radius = format === "tweet" ? 24 : 40;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: STORY_BG,
        padding: outerPadding,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: CARD_BG,
          border: CARD_BORDER,
          borderRadius: radius,
          padding: cardPadding,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function renderStatsCard({
  stats,
  enabledStats,
  topClubs,
  format,
  avatarUrl,
  username,
  logoUrl,
  qrDataUri,
}: {
  stats: ReturnType<typeof computeCollectionStats>;
  enabledStats: Set<StatKey>;
  topClubs: { id: string; name: string; count: number; logoDataUri: string | null }[];
  format: FormatKey;
  avatarUrl: string | null;
  username: string | null;
  logoUrl: string | null;
  qrDataUri: string;
}) {
  const label = stats.total > 1 ? "maillots" : "maillot";

  const secondaryStats: { key: StatKey; value: string; label: string }[] = [];
  if (enabledStats.has("clubs")) {
    secondaryStats.push({ key: "clubs", value: String(stats.clubs), label: "clubs" });
  }
  if (enabledStats.has("leagues")) {
    secondaryStats.push({
      key: "leagues",
      value: String(stats.leagues),
      label: "championnats",
    });
  }
  if (enabledStats.has("countries")) {
    secondaryStats.push({
      key: "countries",
      value: String(stats.countries),
      label: "pays",
    });
  }
  if (enabledStats.has("value") && stats.estimatedValue > 0) {
    secondaryStats.push({
      key: "value",
      value: `${Math.round(stats.estimatedValue)}€`,
      label: "valeur estimée",
    });
  }

  const bigNumberSize =
    format === "story" ? 380 : format === "post" ? 280 : 200;
  const captionSize = format === "story" ? 28 : format === "post" ? 22 : 18;
  const labelSize = format === "story" ? 44 : format === "post" ? 34 : 26;
  const secondaryValueSize =
    format === "story" ? 68 : format === "post" ? 52 : 38;
  const secondaryLabelSize =
    format === "story" ? 22 : format === "post" ? 18 : 15;
  const accentBarWidth =
    format === "story" ? 100 : format === "post" ? 80 : 60;

  return (
    <InnerCard format={format}>
      <CardHeader avatarUrl={avatarUrl} username={username} format={format} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          gap: format === "story" ? 14 : 8,
        }}
      >
        <div
          style={{
            fontSize: captionSize,
            letterSpacing: 8,
            color: TEXT_SECONDARY,
            fontWeight: 600,
            display: "flex",
          }}
        >
          MA COLLECTION
        </div>
        <div
          style={{
            fontSize: bigNumberSize,
            fontWeight: 900,
            lineHeight: 0.95,
            display: "flex",
            letterSpacing: -10,
            backgroundImage:
              "linear-gradient(180deg, #ffffff 0%, #6ea8ff 100%)",
            backgroundClip: "text",
            color: "transparent",
            textShadow: `0 0 60px ${ACCENT_SOFT}, 0 0 120px ${ACCENT_SOFT}`,
          }}
        >
          {stats.total}
        </div>
        <div
          style={{
            width: accentBarWidth,
            height: 4,
            background: `linear-gradient(90deg, transparent 0%, ${ACCENT} 50%, transparent 100%)`,
            borderRadius: 2,
            display: "flex",
          }}
        />
        <div
          style={{
            fontSize: labelSize,
            color: "#d4d4d8",
            display: "flex",
            marginTop: 4,
          }}
        >
          {label}
        </div>
      </div>

      {topClubs.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize:
                format === "story" ? 20 : format === "post" ? 16 : 13,
              letterSpacing: 6,
              color: TEXT_SECONDARY,
              fontWeight: 600,
              display: "flex",
            }}
          >
            TOP CLUBS
          </div>
          <div
            style={{
              display: "flex",
              gap: format === "tweet" ? 12 : 20,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {topClubs.map((c) => {
              const badgeSize =
                format === "story" ? 100 : format === "post" ? 78 : 60;
              const countSize =
                format === "story" ? 22 : format === "post" ? 18 : 14;
              return (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: badgeSize,
                      height: badgeSize,
                      background:
                        "linear-gradient(160deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 100%)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      borderRadius: badgeSize / 2,
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.14), 0 8px 20px rgba(0,0,0,0.3)",
                    }}
                  >
                    {c.logoDataUri && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.logoDataUri}
                        width={badgeSize - 24}
                        height={badgeSize - 24}
                        style={{ objectFit: "contain" }}
                        alt=""
                      />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: countSize,
                      color: "white",
                      fontWeight: 700,
                      display: "flex",
                    }}
                  >
                    {c.count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {secondaryStats.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: format === "tweet" ? 12 : 16,
            justifyContent: "center",
            width: "100%",
          }}
        >
          {secondaryStats.map((s) => (
            <div
              key={s.key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: CHIP_BG,
                border: CHIP_BORDER,
                borderRadius: 24,
                padding:
                  format === "tweet" ? "18px 24px" : "26px 32px",
                gap: 6,
                flex: format === "tweet" ? "1 1 22%" : "1 1 40%",
                minWidth: format === "tweet" ? 130 : 170,
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.14), 0 12px 32px rgba(0,0,0,0.3)",
              }}
            >
              <div
                style={{
                  fontSize: secondaryValueSize,
                  fontWeight: 800,
                  display: "flex",
                  color: "white",
                  letterSpacing: -1.5,
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: secondaryLabelSize,
                  color: "#a5a5b5",
                  display: "flex",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  fontWeight: 600,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      <CardFooter format={format} logoUrl={logoUrl} qrDataUri={qrDataUri} />
    </InnerCard>
  );
}

function renderJerseysCard({
  jerseys,
  subtitle,
  format,
  avatarUrl,
  username,
  logoUrl,
  qrDataUri,
}: {
  jerseys: { id: string; imageUrl: string | null; clubName: string }[];
  subtitle: string;
  format: FormatKey;
  avatarUrl: string | null;
  username: string | null;
  logoUrl: string | null;
  qrDataUri: string;
}) {
  const captionSize = format === "story" ? 28 : format === "post" ? 22 : 18;
  const cellWidth = format === "story" ? 360 : format === "post" ? 260 : 160;
  const cellHeight = format === "story" ? 380 : format === "post" ? 280 : 170;
  const imgSize = format === "story" ? 300 : format === "post" ? 210 : 130;
  const clubFontSize = format === "story" ? 20 : format === "post" ? 16 : 12;
  const colsPerRow = format === "tweet" ? 6 : format === "post" ? 3 : 2;
  const gridGap = format === "tweet" ? 10 : 14;

  // Build rows explicitly instead of relying on flex-wrap, which is unreliable
  // in Satori (next/og) when the wrapped row's total size is close to bounds.
  const rows: (typeof jerseys)[] = [];
  for (let i = 0; i < jerseys.length; i += colsPerRow) {
    rows.push(jerseys.slice(i, i + colsPerRow));
  }

  return (
    <InnerCard format={format}>
      <CardHeader avatarUrl={avatarUrl} username={username} format={format} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: format === "story" ? 24 : 14,
          width: "100%",
        }}
      >
        <div
          style={{
            fontSize: captionSize,
            letterSpacing: 8,
            color: TEXT_SECONDARY,
            fontWeight: 600,
            display: "flex",
          }}
        >
          {subtitle}
        </div>

        {jerseys.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: captionSize + 4,
              color: TEXT_SECONDARY,
              padding: "40px 0",
            }}
          >
            Cette collection démarre bientôt
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: gridGap,
              alignItems: "center",
              width: "100%",
            }}
          >
            {rows.map((row, ri) => (
              <div
                key={ri}
                style={{
                  display: "flex",
                  gap: gridGap,
                  justifyContent: "center",
                }}
              >
                {row.map((j) => (
                  <div
                    key={j.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      background: CHIP_BG,
                      border: CHIP_BORDER,
                      borderRadius: 24,
                      padding: 14,
                      width: cellWidth,
                      height: cellHeight,
                      gap: 6,
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.10), 0 12px 32px rgba(0,0,0,0.3)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        width: imgSize,
                        height: imgSize,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {j.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={j.imageUrl}
                          width={imgSize}
                          height={imgSize}
                          style={{ objectFit: "contain" }}
                          alt=""
                        />
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            width: imgSize,
                            height: imgSize,
                            background: "rgba(255,255,255,0.04)",
                            borderRadius: 12,
                          }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: clubFontSize,
                        color: "#d4d4d8",
                        display: "flex",
                        textAlign: "center",
                        fontWeight: 600,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                      }}
                    >
                      {j.clubName}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <CardFooter format={format} logoUrl={logoUrl} qrDataUri={qrDataUri} />
    </InnerCard>
  );
}
