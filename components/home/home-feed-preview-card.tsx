import Image from "next/image";
import { Link } from "@/i18n/routing";
import { PostCardJersey } from "@/components/feed/post-card-jersey";
import { PostCardAchievement } from "@/components/feed/post-card-achievement";
import { PostCardCap } from "@/components/feed/post-card-cap";
import { HomeFeedCardActions } from "@/components/home/home-feed-card-actions";
import type {
  FeedPostItem,
  JerseyAddPayload,
  AchievementUnlockPayload,
  CapReachedPayload,
} from "@/types/feed";

/**
 * Carte feed de la homepage. Reutilise les vrais corps de carte (clic maillot =>
 * modal) et un ilot d'actions (like + commentaire). Les deux composants lourds
 * (modal maillot, drawer commentaires) sont charges en lazy au clic, donc le
 * bundle initial de la homepage reste leger. On omet volontairement le menu
 * options, le signalement, le follow et le timestamp (date-fns) du feed complet.
 */
export function HomeFeedPreviewCard({ post }: { post: FeedPostItem }) {
  if (!post.author || post.payload === null) return null;
  const author = post.author;

  return (
    <article className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <header className="flex items-center gap-3 px-3 py-2.5">
        <Link
          href={`/u/${author.username}`}
          className="flex items-center gap-3 flex-1 min-w-0 group"
        >
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
            <p className="font-semibold text-sm truncate group-hover:underline">
              @{author.username}
            </p>
            {author.favoriteClubName && (
              <p className="text-xs text-muted-foreground truncate">
                {author.favoriteClubName}
              </p>
            )}
          </div>
        </Link>
      </header>

      {post.type === "JERSEY_ADD" && (
        <PostCardJersey payload={post.payload as JerseyAddPayload} />
      )}
      {post.type === "ACHIEVEMENT_UNLOCK" && (
        <div className="px-4 pb-4">
          <PostCardAchievement
            payload={post.payload as AchievementUnlockPayload}
          />
        </div>
      )}
      {post.type === "CAP_REACHED" && (
        <div className="px-4 pb-4">
          <PostCardCap payload={post.payload as CapReachedPayload} />
        </div>
      )}

      <HomeFeedCardActions post={post} />
    </article>
  );
}
