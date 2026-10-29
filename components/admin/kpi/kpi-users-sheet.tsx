"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { KpiUser } from "@/types/admin-kpi";

export type KpiUsersQuery = {
  title: string;
  description: string;
  /** Paramètres de GET /api/admin/kpi/users */
  params: Record<string, string>;
};

interface KpiUsersSheetProps {
  query: KpiUsersQuery | null;
  onClose: () => void;
}

export function KpiUsersSheet({ query, onClose }: KpiUsersSheetProps) {
  const search = query ? new URLSearchParams(query.params).toString() : "";
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-kpi-users", search],
    enabled: query !== null,
    queryFn: async (): Promise<KpiUser[]> => {
      const res = await fetch(`/api/admin/kpi/users?${search}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return (await res.json()).users;
    },
  });

  return (
    <Sheet open={query !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{query?.title}</SheetTitle>
          <SheetDescription>{query?.description}</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-2">
          {isLoading &&
            Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          {isError && (
            <p className="text-sm text-destructive">Impossible de charger les utilisateurs.</p>
          )}
          {data?.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun utilisateur.</p>
          )}
          {data?.length === 100 && (
            <p className="text-xs text-muted-foreground">Limité aux 100 premiers.</p>
          )}
          {data?.map((user) => (
            <Link
              key={user.id}
              href={`/u/${user.username}`}
              target="_blank"
              className="flex items-center gap-3 rounded-lg border p-2 hover:bg-muted cursor-pointer"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">@{user.username}</p>
                <p className="text-xs text-muted-foreground">
                  Inscrit le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <Badge variant="outline">{user.platform === "ios" ? "iOS" : "Web"}</Badge>
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
