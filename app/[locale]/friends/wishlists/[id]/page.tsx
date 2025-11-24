import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { FriendWishlistStats } from "@/components/friends/friend-wishlist-stats";
import { FriendWishlistGrid } from "@/components/friends/friend-wishlist-grid";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { Heart, ArrowLeft, Gift } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FriendWishlistPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getFriendWishlist(currentUserId: string, friendId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId: currentUserId, receiverId: friendId, status: "ACCEPTED" },
        { senderId: friendId, receiverId: currentUserId, status: "ACCEPTED" },
      ],
    },
  });

  if (!friendship) return null;

  const friendUser = await prisma.user.findUnique({
    where: { id: friendId },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      bio: true,
      favoriteClub: {
        select: { id: true, name: true },
      },
    },
  });

  if (!friendUser) return null;

  let avatarUrl = null;
  if (friendUser.avatar) {
    const { data } = await supabaseAdmin.storage
      .from("avatar")
      .createSignedUrl(friendUser.avatar, 60 * 60);
    avatarUrl = data?.signedUrl || null;
  }

  const wishlistItems = await prisma.wishlist.findMany({
    where: { userId: friendId },
    select: {
      id: true,
      jerseyId: true,
      priority: true,
      createdAt: true,
      jersey: {
        include: {
          club: { include: { league: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const wishlist = wishlistItems.map((item) => ({
    ...item,
    jersey: {
      ...item.jersey,
      retailPrice: item.jersey.retailPrice
        ? Number(item.jersey.retailPrice)
        : null,
    },
  }));

  const totalItems = wishlist.length;
  const totalValue = wishlist.reduce(
    (sum, item) => sum + (item.jersey.retailPrice || 0),
    0
  );

  const leagueStats = wishlist.reduce((acc, item) => {
    const league = item.jersey.club.league.name;
    acc[league] = (acc[league] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeStats = wishlist.reduce((acc, item) => {
    const type = item.jersey.type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityStats = wishlist.reduce((acc, item) => {
    acc[item.priority] = (acc[item.priority] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return {
    user: {
      id: friendUser.id,
      username: friendUser.username,
      name: friendUser.name,
      avatar: friendUser.avatar,
      avatarUrl,
      bio: friendUser.bio,
      favoriteClub: friendUser.favoriteClub || null,
    },
    wishlist,
    stats: {
      total: totalItems,
      totalValue: totalValue > 0 ? totalValue : null,
      leagueStats,
      typeStats,
      priorityStats,
    },
  };
}

export async function generateMetadata({ params }: FriendWishlistPageProps) {
  const currentUser = await getCurrentUser();
  const t = await getTranslations("Wishlist");

  if (!currentUser)
    return { title: `${t("wishlistNotFound")} - Le Vestiaire` };

  const { id: userId } = await params;
  const data = await getFriendWishlist(currentUser.id, userId);

  if (!data) {
    return {
      title: `${t("wishlistNotFound")} - Le Vestiaire`,
    };
  }

  const displayName = data.user.username ?? t("user");
  return {
    title: `${t("wishlistOf", { name: displayName })} - Le Vestiaire`,
    description: `${t("discoverWishlist")} ${displayName} : ${data.stats.total} ${data.stats.total > 1 ? t("jerseys") : t("jersey")}`,
  };
}

export default async function FriendWishlistPage({
  params,
}: FriendWishlistPageProps) {
  const currentUser = await getCurrentUser();
  const t = await getTranslations("Wishlist");

  if (!currentUser) {
    redirect("/auth/login");
  }

  const { id: userId } = await params;
  const data = await getFriendWishlist(currentUser.id, userId);

  if (!data) {
    notFound();
  }

  const { user, wishlist, stats } = data;
  const displayName = user.username ?? t("user");

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/friends/collections">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <Gift className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">
            {t("wishlistOf", { name: displayName })}
          </h1>
          <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
            {stats.total} {stats.total > 1 ? t("jerseys") : t("jersey")}
          </span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-4">
          <UserAvatar
            src={user.avatarUrl || undefined}
            name={user.name}
            size="lg"
          />
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{displayName}</h2>
            {user.favoriteClub && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Heart className="w-4 h-4 text-red-500" />
                {user.favoriteClub.name}
              </p>
            )}
            {user.bio && (
              <p className="text-sm text-muted-foreground mt-2">{user.bio}</p>
            )}
          </div>
        </div>
      </div>

      <FriendWishlistStats stats={stats} />

      {wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Gift className="w-16 h-16 text-muted-foreground/30 mb-6" />
          <h3 className="text-xl font-medium text-muted-foreground mb-2">
            {t("emptyWishlist")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {t("noJerseysInWishlistYet", { name: displayName })}
          </p>
        </div>
      ) : (
        <FriendWishlistGrid wishlistItems={wishlist} />
      )}
    </div>
  );
}
