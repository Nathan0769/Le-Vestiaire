"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SupporterBadge } from "@/components/supporter/supporter-badge";
import { FRAMES, BANNERS } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";
import { Check, Heart, Lock } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function CosmeticsSettings() {
  const t = useTranslations("Settings.cosmetics");
  const user = useCurrentUser();
  const isSupporter = user?.isSupporter ?? false;

  const [frame, setFrame] = useState<string | null>(user?.avatarFrame ?? null);
  const [banner, setBanner] = useState<string | null>(
    user?.profileBanner ?? null
  );
  const [saving, setSaving] = useState(false);

  const persist = async (patch: {
    avatarFrame?: string | null;
    profileBanner?: string | null;
  }) => {
    setSaving(true);
    try {
      await fetch("/api/user/cosmetics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } finally {
      setSaving(false);
    }
  };

  const selectFrame = (key: string | null) => {
    setFrame(key);
    void persist({ avatarFrame: key });
  };
  const selectBanner = (key: string | null) => {
    setBanner(key);
    void persist({ profileBanner: key });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("title")}
          <SupporterBadge size="sm" />
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-7">
        {!isSupporter ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t("locked")}</p>
            <Button asChild size="sm" className="cursor-pointer">
              <Link href="/soutien">
                <Heart className="mr-2 h-4 w-4" />
                {t("unlock")}
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Contour d'avatar */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("frameLabel")}</p>
              <div className="flex flex-wrap gap-3">
                <RingSwatch active={frame === null} onClick={() => selectFrame(null)} disabled={saving} />
                {Object.entries(FRAMES).map(([key, cosmetic]) => (
                  <RingSwatch
                    key={key}
                    ringClass={cosmetic.className}
                    active={frame === key}
                    onClick={() => selectFrame(key)}
                    disabled={saving}
                  />
                ))}
              </div>
            </div>

            {/* Bannière de profil */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("bannerLabel")}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <BannerSwatch active={banner === null} onClick={() => selectBanner(null)} disabled={saving} />
                {Object.entries(BANNERS).map(([key, cosmetic]) => (
                  <BannerSwatch
                    key={key}
                    bannerClass={cosmetic.className}
                    active={banner === key}
                    onClick={() => selectBanner(key)}
                    disabled={saving}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RingSwatch({
  ringClass,
  active,
  onClick,
  disabled,
}: {
  ringClass?: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full p-0.5 cursor-pointer transition",
        active ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
      )}
    >
      <span className={cn("cos-ring block", ringClass)}>
        <span className="block h-10 w-10 rounded-full bg-muted" />
      </span>
    </button>
  );
}

function BannerSwatch({
  bannerClass,
  active,
  onClick,
  disabled,
}: {
  bannerClass?: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative h-14 rounded-lg overflow-hidden border cursor-pointer transition",
        active ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "border-border"
      )}
    >
      {bannerClass ? (
        <span className={cn("cos-banner block h-full w-full", bannerClass)} />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
          {active && <Check className="h-4 w-4" />}
        </span>
      )}
    </button>
  );
}
