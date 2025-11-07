import { getCurrentUser } from "@/lib/get-current-user";
import { redirect } from "next/navigation";
import { Users, Package, Heart } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/profiles/user-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const metadata = {
  title: "Collections des amis - Le Vestiaire",
  description:
    "Découvrez les collections de maillots de football de vos amis collectionneurs",
};

export default async function FriendsCollectionsPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Friends");

  if (!user) {
    redirect("/auth/login");
  }

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { senderId: user.id, status: "ACCEPTED" },
        { receiverId: user.id, status: "ACCEPTED" },
      ],
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          bio: true,
          favoriteClub: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      receiver: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          bio: true,
          favoriteClub: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const friends = await Promise.all(
    friendships.map(async (friendship) => {
      const friend =
        friendship.senderId === user.id
          ? friendship.receiver
          : friendship.sender;

      let avatarUrl = null;
      if (friend.avatar) {
        const { data } = await supabaseAdmin.storage
          .from("avatar")
          .createSignedUrl(friend.avatar, 60 * 60);
        avatarUrl = data?.signedUrl || null;
      }

      return {
        userId: friend.id,
        username: friend.username,
        name: friend.name,
        avatarUrl,
        bio: friend.bio,
        favoriteClub: friend.favoriteClub || null,
      };
    })
  );

  const sortKey = (u: { username?: string | null; name?: string | null }) =>
    u.username?.trim() || u.name?.trim() || "";

  friends.sort((a, b) =>
    sortKey(a).localeCompare(sortKey(b), "fr", { sensitivity: "base" })
  );

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">{t("friendsCollections")}</h1>
      </div>

      <p className="text-muted-foreground">
        {t("discoverCollections")}
      </p>

      {friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-16 h-16 text-muted-foreground/30 mb-6" />
          <h3 className="text-xl font-medium text-muted-foreground mb-2">
            {t("noFriendsYet")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {t("addFriendsToDiscover")}
          </p>
          <Link
            href="/friends"
            className="mt-4 text-primary hover:underline text-sm"
          >
            {t("searchFriends")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {friends.map((friend) => (
            <Link
              key={friend.userId}
              href={`/friends/collections/${friend.userId}`}
              className="group"
            >
              <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={friend.avatarUrl || undefined}
                      name={friend.name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                        {friend.username ?? friend.name ?? t("user")}
                      </CardTitle>
                      {friend.favoriteClub && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Heart className="w-3 h-3 text-red-500" />{" "}
                          {friend.favoriteClub.name}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 flex-1">
                  {friend.bio ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {friend.bio}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic">
                      {t("noBio")}
                    </p>
                  )}
                </CardContent>

                <CardContent className="pt-3 border-t mt-auto">
                  <div className="flex items-center gap-2 text-sm text-primary font-medium">
                    <Package className="w-4 h-4" />
                    <span>{t("viewCollection")}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
