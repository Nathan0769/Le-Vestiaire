import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/get-current-user";
import { redirect } from "next/navigation";
import { FriendsClient } from "@/components/friends/friends-client";

export const metadata: Metadata = {
  title: "Mes amis - Le Vestiaire Foot",
  description: "Gérez vos amis et consultez leurs collections de maillots.",
  robots: { index: false, follow: false },
};

export default async function FriendsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <Suspense
      fallback={
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      }
    >
      <FriendsClient />
    </Suspense>
  );
}
