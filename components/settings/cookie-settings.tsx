"use client";

import { Cookie } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clearConsent } from "@/lib/cookie-consent";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function CookieSettings() {
  const t = useTranslations("Settings.cookieSettings");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Cookie className="h-5 w-5 text-primary" />
          <CardTitle>{t("title")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("description")}
        </p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={clearConsent}
            variant="outline"
            className="w-full sm:w-auto cursor-pointer"
          >
            {t("modifyButton")}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("modifyDescription")}
          </p>
        </div>
        <div className="pt-2 border-t">
          <Link
            href="/politique-cookies"
            className="text-sm text-primary hover:underline"
          >
            {t("viewPolicyLink")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
