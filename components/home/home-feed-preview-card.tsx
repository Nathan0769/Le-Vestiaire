import Image from "next/image";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { Heart, MessageCircle, Trophy } from "lucide-react";
import { getBadgeUrl } from "@/lib/achievements/badge-url";
import type {
  FeedPostItem,
  JerseyAddPayload,
  AchievementUnlockPayload,
  CapReachedPayload,
} from "@/types/feed";

const TIER_GRADIENT: Record<string, string> = {
  PLATINUM: "from-cyan-400 via-blue-500 to-indigo-600",
  GOLD: "from-amber-300 via-yellow-500 to-orange-500",
  SILVER: "from-slate-200 via-slate-400 to-slate-600",
  BRONZE: "from-orange-400 via-orange-600 to-amber-800",
};

const CAP_META: Record<string, { big: string; kind: "collection" | "value" }> = {
  COLLECTION_50: { big: "50", kind: "collection" },
  COLLECTION_100: { big: "100", kind: "collection" },
  COLLECTION_500: { big: "500", kind: "collection" },
  COLLECTION_1000: { big: "1000", kind: "collection" },
  VALUE_1K: { big: "1 000€", kind: "value" },
  VALUE_5K: { big: "5 000€", kind: "value" },
  VALUE_25K: { big: "25 000€", kind: "value" },
};

/**
 * Carte de teaser 100% server, read-only, pour la section feed de la homepage.
 * Toute la carte pointe vers /feed : aucune interactivite, donc aucun bundle
 * client du feed (drawer, modal, mutations, date-fns) n'est charge sur la home.
 */
export async function HomeFeedPreviewCard({ post }: { post: FeedPostItem }) {
  if (!post.author || post.payload === null) return null;

  const author = post.author;

  return (
    <Link
      href="/feed"
      className="block bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <header className="flex items-center gap-3 px-3 py-2.5">
        {author.avatarUrl ? (
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
            <Image
              src={author.avatarUrl}
              alt=""
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {author.username.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">@{author.username}</p>
          {author.favoriteClubName && (
            <p className="text-xs text-muted-foreground truncate">
              {author.favoriteClubName}
            </p>
          )}
        </div>
      </header>

      {post.type === "JERSEY_ADD" && (
        <JerseyPreview payload={post.payload as JerseyAddPayload} />
      )}
      {post.type === "ACHIEVEMENT_UNLOCK" && (
        <AchievementPreview
          payload={post.payload as AchievementUnlockPayload}
        />
      )}
      {post.type === "CAP_REACHED" && (
        <CapPreview payload={post.payload as CapReachedPayload} />
      )}

      <footer className="flex items-center gap-4 px-3 py-2.5 border-t border-border text-muted-foreground">
        <span className="flex items-center gap-1.5 text-sm">
          <Heart className="w-4 h-4" />
          {post.likeCount}
        </span>
        <span className="flex items-center gap-1.5 text-sm">
          <MessageCircle className="w-4 h-4" />
          {post.commentCount}
        </span>
      </footer>
    </Link>
  );
}

async function JerseyPreview({ payload }: { payload: JerseyAddPayload }) {
  const t = await getTranslations("Feed.post");
  const tType = await getTranslations("JerseyType");
  const displayImage = payload.customPhotoUrl ?? payload.jersey.imageUrl;
  const title = t("jerseyTitleTemplate", {
    type: tType(payload.jersey.type as never),
    club: payload.jersey.club.shortName,
    season: payload.jersey.season,
  });

  return (
    <>
      <div className="relative bg-muted/40 aspect-square w-full overflow-hidden">
        <Image
          src={displayImage}
          alt={title}
          fill
          unoptimized
          className="object-contain p-3"
          sizes="(max-width: 768px) 100vw, 400px"
        />
      </div>
      <div className="px-3 pt-3 pb-1">
        <p className="font-semibold text-base leading-snug line-clamp-1">
          {title}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          {payload.jersey.club.shortName} · {payload.jersey.season}
        </p>
      </div>
    </>
  );
}

async function AchievementPreview({
  payload,
}: {
  payload: AchievementUnlockPayload;
}) {
  const tPost = await getTranslations("Feed.post");
  const tRoot = await getTranslations();
  const gradient =
    TIER_GRADIENT[payload.tier ?? "PLATINUM"] ?? TIER_GRADIENT.PLATINUM;
  const badgeUrl = getBadgeUrl(payload.key);
  const tierLabel = tPost(
    `achievementTiers.${payload.tier ?? "PLATINUM"}` as never
  );

  let title = payload.key;
  try {
    const parts = payload.key.split(".");
    const resolved = tRoot(
      `achievements.definitions.${parts[0]}.${parts.slice(1).join(".")}.title`
    );
    if (resolved && !resolved.startsWith("achievements.")) title = resolved;
  } catch {
    // clé i18n manquante : on garde payload.key
  }

  return (
    <div className="px-3 py-3">
      <div
        className={`relative bg-gradient-to-br ${gradient} rounded-lg p-4 text-white flex items-center gap-3`}
      >
        {badgeUrl ? (
          <Image
            src={badgeUrl}
            alt=""
            width={40}
            height={40}
            unoptimized
            className="w-10 h-10 object-contain flex-shrink-0 drop-shadow"
          />
        ) : (
          <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
            <Trophy className="w-5 h-5" strokeWidth={2.5} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest opacity-80 font-semibold">
            {tPost("achievementUnlocked", { tier: tierLabel })}
          </p>
          <p className="text-base font-bold mt-0.5 leading-tight line-clamp-1">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}

async function CapPreview({ payload }: { payload: CapReachedPayload }) {
  const t = await getTranslations("Feed.post");
  const meta = CAP_META[payload.capKind] ?? {
    big: "",
    kind: "collection" as const,
  };
  const capLabel =
    meta.kind === "collection"
      ? t("capCollectionLabel")
      : t("capValueLabel");

  return (
    <div className="px-3 py-3">
      <div className="rounded-lg overflow-hidden border border-border">
        <div className="grid grid-cols-4 gap-px bg-border h-24">
          {[0, 1, 2, 3].map((i) => {
            const src = payload.mosaic[i]?.imageUrl;
            return (
              <div key={i} className="relative bg-muted">
                {src ? (
                  <Image
                    src={src}
                    alt=""
                    fill
                    unoptimized
                    className="object-contain"
                    sizes="100px"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="bg-gradient-to-br from-primary/90 to-primary p-3 text-primary-foreground text-center">
          <p className="text-2xl font-bold tracking-tight">{meta.big}</p>
          <p className="text-xs font-medium mt-0.5 opacity-90">{capLabel}</p>
        </div>
      </div>
    </div>
  );
}
