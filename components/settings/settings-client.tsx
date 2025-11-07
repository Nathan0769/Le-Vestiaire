"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AccountInfo } from "./account-info";
import { EmailSettings } from "./email-settings";
import { PasswordSettings } from "./password-settings";
import { SessionSettings } from "./session-settings";
import { LeaderboardPrivacySettings } from "./leaderboard-privacy-settings";
import { CookieSettings } from "./cookie-settings";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function SettingsClient() {
  const t = useTranslations("Settings");
  const currentUser = useCurrentUser();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
      </div>

      <div className="grid gap-6">
        <AccountInfo user={currentUser} />
        <LeaderboardPrivacySettings userId={currentUser.id} />

        <EmailSettings
          isGoogleOnly={currentUser.authProvider?.isGoogleOnly ?? false}
        />

        <PasswordSettings
          hasPassword={currentUser.authProvider?.hasPassword ?? true}
          isGoogleOnly={currentUser.authProvider?.isGoogleOnly ?? false}
        />
        <Separator />
        <SessionSettings />
        <CookieSettings />
        <div className="text-muted-foreground text-center text-xs">
          {t("footer.text")}{" "}
          <Link href="/conditions-utilisation" className="underline">
            {t("footer.terms")}
          </Link>
          ,{" "}
          <Link href="/politique-confidentialite" className="underline">
            {t("footer.privacy")}
          </Link>{" "}
          {t("footer.and")}{" "}
          <Link href="/politique-cookies" className="underline">
            {t("footer.cookies")}
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
