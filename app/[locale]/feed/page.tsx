import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { redirect } from "next/navigation";
import { getFeedForUser } from "@/lib/feed/get-feed";
import { enrichPostsForFeed } from "@/lib/feed/enrich-posts";
import { FeedTimeline } from "@/components/feed/feed-timeline";
import type { FeedPage } from "@/types/feed";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Follow" });
  return {
    title: t("metadataFeedTitle"),
    description: t("metadataFeedDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login?redirect=/feed");
  }

  const { items: posts, nextCursor } = await getFeedForUser(user.id, {
    limit: 20,
    scope: "friends",
  });
  const items = await enrichPostsForFeed(posts, user.id);
  const initialData: FeedPage = { items, nextCursor };

  return (
    <div className="p-6">
      <FeedTimeline initialData={initialData} />
    </div>
  );
}
