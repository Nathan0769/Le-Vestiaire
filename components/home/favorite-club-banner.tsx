"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";

const DISMISSED_KEY = "favoriteClubBannerDismissed";

// Pages où la bannière ne doit pas apparaître
const EXCLUDED_PATHS = ["/auth/login", "/auth/signUp", "/auth/onboarding"];

export function FavoriteClubBanner() {
  const t = useTranslations("Onboarding");
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    if (EXCLUDED_PATHS.some((p) => pathname.includes(p))) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    fetch("/api/user/favorite-club")
      .then((r) => {
        if (!r.ok) return;
        return r.json();
      })
      .then((data) => {
        if (data === null) setShow(true);
      })
      .catch(() => {});
  }, [session?.user, pathname]);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-muted/60">
      <div className="flex items-center gap-2.5">
        <Heart className="w-4 h-4 text-red-500 shrink-0" />
        <p className="text-sm text-muted-foreground">
          {t("bannerText")}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/auth/onboarding">
          <Button variant="outline" size="sm" className="cursor-pointer h-7 text-xs">
            {t("bannerCta")}
          </Button>
        </Link>
        <button
          onClick={dismiss}
          aria-label="Fermer"
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
