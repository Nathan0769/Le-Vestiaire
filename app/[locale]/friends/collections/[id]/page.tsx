import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { FriendCollectionStats } from "@/components/friends/friend-collection-stats";
import { FriendCollectionGrid } from "@/components/friends/friend-collection-grid";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { Package, ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FriendCollectionPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getFriendCollection(currentUserId: string, friendId: string) {
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

  const collectionItems = await prisma.userJersey.findMany({
    where: { userId: friendId },
    select: {
      id: true,
      jerseyId: true,
      size: true,
      condition: true,
      hasTags: true,
      personalization: true,
      purchasePrice: true,
      purchaseDate: true,
      isGift: true,
      isFromMysteryBox: true,
      createdAt: true,
      updatedAt: true,
      jersey: {
        include: {
          club: { include: { league: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const collection = collectionItems.map((item) => ({
    ...item,
    purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
    jersey: {
      ...item.jersey,
      retailPrice: item.jersey.retailPrice
        ? Number(item.jersey.retailPrice)
        : null,
    },
  }));

  const totalJerseys = collection.length;
  const totalValue = collection.reduce(
    (sum, item) => sum + (item.purchasePrice || 0),
    0
  );

  const leagueStats = collection.reduce((acc, item) => {
    const league = item.jersey.club.league.name;
    acc[league] = (acc[league] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const conditionStats = collection.reduce((acc, item) => {
    acc[item.condition] = (acc[item.condition] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeStats = collection.reduce((acc, item) => {
    const type = item.jersey.type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const giftCount = collection.filter((item) => item.isGift).length;
  const mysteryBoxCount = collection.filter(
    (item) => item.isFromMysteryBox
  ).length;
  const regularCount = collection.filter(
    (item) => !item.isGift && !item.isFromMysteryBox
  ).length;

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
    collection,
    stats: {
      total: totalJerseys,
      totalValue: totalValue > 0 ? totalValue : null,
      leagueStats,
      conditionStats,
      typeStats,
      provenanceStats: {
        regular: regularCount,
        gifts: giftCount,
        mysteryBox: mysteryBoxCount,
      },
    },
  };
}

export async function generateMetadata({ params }: FriendCollectionPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { title: "Collection introuvable - Le Vestiaire" };

  const { id: userId } = await params;
  const data = await getFriendCollection(currentUser.id, userId);

  if (!data) {
    return {
      title: "Collection introuvable - Le Vestiaire",
    };
  }

  return {
    title: `Collection de ${
      data.user.username ?? "Utilisateur"
    } - Le Vestiaire`,
    description: `Découvrez la collection de ${
      data.user.username ?? "Utilisateur"
    } : ${data.stats.total} maillots de football`,
  };
}

export default async function FriendCollectionPage({
  params,
}: FriendCollectionPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const { id: userId } = await params;
  const data = await getFriendCollection(currentUser.id, userId);

  if (!data) {
    notFound();
  }

  const { user, collection, stats } = data;

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/friends/collections">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">
            Collection de {user.username ?? "Utilisateur"}
          </h1>
          <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
            {stats.total} maillot{stats.total > 1 ? "s" : ""}
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
            <h2 className="text-xl font-semibold">
              {user.username ?? "Utilisateur"}
            </h2>
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

      <FriendCollectionStats stats={stats} />

      {collection.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-16 h-16 text-muted-foreground/30 mb-6" />
          <h3 className="text-xl font-medium text-muted-foreground mb-2">
            Collection vide
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {user.username ?? "Cet utilisateur"} n&apos;a pas encore ajouté de
            maillots à sa collection.
          </p>
        </div>
      ) : (
        <FriendCollectionGrid collectionItems={collection} />
      )}
    </div>
  );
}
