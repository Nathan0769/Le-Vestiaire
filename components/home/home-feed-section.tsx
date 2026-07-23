import { Rss, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/feed/post-card";
import { getTopPosts } from "@/lib/feed/get-top-posts";
import { enrichPostsForFeed } from "@/lib/feed/enrich-posts";
import { getTranslations } from "next-intl/server";

interface HomeFeedSectionProps {
  userId: string;
}

/**
 * Section homepage : les posts les plus populaires de la plateforme sur les 14 derniers jours.
 * Server Component : SSR, disparait si aucun post ne remonte.
 */
export async function HomeFeedSection({ userId }: HomeFeedSectionProps) {
  const rawPosts = await getTopPosts(userId, { days: 14, limit: 3 });
  if (rawPosts.length === 0) return null;

  const posts = await enrichPostsForFeed(rawPosts, userId);
  const t = await getTranslations("HomeFeed");

  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-3xl md:text-4xl font-bold">{t("title")}</h2>
            <Rss className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>

        <div className="text-center">
          <Link href="/feed">
            <Button size="lg" className="cursor-pointer gap-2">
              {t("cta")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
