import { ImageResponse } from "next/og";
import prisma from "@/lib/prisma";
import { getR2PresignedUrl, AVATARS_BUCKET } from "@/lib/r2-storage";

export const runtime = "nodejs";
export const revalidate = 3600;
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Le Vestiaire — Collection de maillots";

interface OgProps {
  params: Promise<{ username: string }>;
}

export default async function OpengraphImage({ params }: OgProps) {
  const { username: raw } = await params;
  const username = raw.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      createdAt: true,
    },
  });

  if (!user) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
            color: "white",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div style={{ fontSize: 84, fontWeight: 700 }}>Le Vestiaire</div>
        </div>
      ),
      { ...size },
    );
  }

  const [jerseyCount, recentJerseys] = await Promise.all([
    prisma.userJersey.count({ where: { userId: user.id } }),
    prisma.userJersey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        jersey: { select: { imageUrl: true, name: true } },
      },
    }),
  ]);

  const avatarUrl = user.avatar
    ? await getR2PresignedUrl(AVATARS_BUCKET, user.avatar, 60 * 60)
    : null;

  const memberSince = user.createdAt.getFullYear();
  const jerseyLabel = jerseyCount > 1 ? "maillots" : "maillot";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
          color: "white",
          padding: 60,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "38%",
            gap: 16,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              width={180}
              height={180}
              style={{ borderRadius: "50%", objectFit: "cover" }}
              alt=""
            />
          ) : (
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: "#333",
              }}
            />
          )}
          <div style={{ fontSize: 56, fontWeight: 700, display: "flex" }}>
            @{user.username}
          </div>
          {user.name && (
            <div style={{ fontSize: 28, color: "#a3a3a3", display: "flex" }}>
              {user.name}
            </div>
          )}
          <div
            style={{
              fontSize: 36,
              color: "#e5e5e5",
              marginTop: 12,
              display: "flex",
            }}
          >
            {jerseyCount} {jerseyLabel}
          </div>
          <div style={{ fontSize: 22, color: "#a3a3a3", display: "flex" }}>
            Membre depuis {memberSince}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            width: "62%",
            paddingLeft: 30,
          }}
        >
          {recentJerseys.length > 0 ? (
            recentJerseys.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  background: "#1f1f2e",
                  borderRadius: 16,
                  overflow: "hidden",
                  width: 210,
                  height: 210,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={item.jersey.imageUrl}
                  width={200}
                  height={200}
                  style={{ objectFit: "contain" }}
                  alt=""
                />
              </div>
            ))
          ) : (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                color: "#a3a3a3",
              }}
            >
              Cette collection démarre bientôt
            </div>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 30,
            right: 40,
            fontSize: 24,
            color: "#a3a3a3",
            display: "flex",
          }}
        >
          levestiaire.app
        </div>
      </div>
    ),
    { ...size },
  );
}
