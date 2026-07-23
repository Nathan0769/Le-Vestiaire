"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/profiles/user-avatar";
import Link from "next/link";
import { Lock } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useFollow } from "@/hooks/useFollow";
import type { PublicUser } from "@/types/follow";

interface PrivacySettingsProps {
  initialIsPrivate: boolean;
}

export function PrivacySettings({ initialIsPrivate }: PrivacySettingsProps) {
  const t = useTranslations("Privacy");
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const queryClient = useQueryClient();
  const { unblock } = useFollow();

  const privacyMutation = useMutation({
    mutationFn: async (value: boolean) => {
      const res = await fetch("/api/user/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrivate: value }),
      });
      if (!res.ok) throw new Error("privacy error");
      return res.json();
    },
    onSuccess: (data, value) => {
      setIsPrivate(value);
      trackEvent({
        name: "privacy_toggled",
        params: { new_state: value ? "private" : "public" },
      });
    },
    onError: () => setIsPrivate((prev) => !prev),
  });

  const blocked = useQuery({
    queryKey: ["blocked-users"],
    queryFn: async () => {
      const res = await fetch("/api/user/blocked");
      if (!res.ok) return { items: [] as PublicUser[] };
      return (await res.json()) as { items: PublicUser[] };
    },
  });

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4" /> {t("privateLabel")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("privateDescription")}
            </p>
          </div>
          <Switch
            checked={isPrivate}
            onCheckedChange={(v) => {
              setIsPrivate(v);
              privacyMutation.mutate(v);
            }}
            disabled={privacyMutation.isPending}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("blockedLabel")}</h2>
        {blocked.isLoading && (
          <p className="text-sm text-muted-foreground">{t("blockedLoading")}</p>
        )}
        {!blocked.isLoading && (blocked.data?.items.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">{t("blockedEmpty")}</p>
        )}
        <div className="space-y-2">
          {blocked.data?.items.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 p-3 border border-border rounded-lg"
            >
              <Link
                href={`/u/${u.username}`}
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              >
                <UserAvatar
                  src={u.avatarUrl || u.image || undefined}
                  name={u.name}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{u.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{u.username}
                  </p>
                </div>
              </Link>
              <Button
                size="sm"
                variant="outline"
                className="cursor-pointer"
                onClick={async () => {
                  const res = await unblock(u.id);
                  if (res.success) {
                    queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
                  }
                }}
              >
                {t("unblock")}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
