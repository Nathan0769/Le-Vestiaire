"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function AuthGateBanner() {
  const t = useTranslations("Profile.authBanner");
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const returnTo = encodeURIComponent(pathname);

  return (
    <div className="relative rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4 md:p-5">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
        aria-label={t("dismiss")}
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 pr-8">
        <div className="flex items-start gap-3 flex-1">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm md:text-base">{t("title")}</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              {t("subtitle")}
            </p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button asChild size="sm">
            <Link href={`/auth/signUp?returnTo=${returnTo}`}>
              {t("signup")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/auth/login?returnTo=${returnTo}`}>
              {t("login")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
