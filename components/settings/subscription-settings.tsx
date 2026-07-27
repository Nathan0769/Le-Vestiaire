"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SupporterBadge } from "@/components/supporter/supporter-badge";
import { ExternalLink, Heart, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function SubscriptionSettings() {
  const t = useTranslations("Settings.subscription");
  const user = useCurrentUser();
  const [loading, setLoading] = useState(false);

  const isSupporter = user?.isSupporter ?? false;

  const handleManage = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("title")}
          {isSupporter && <SupporterBadge size="sm" />}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium text-muted-foreground">
            {t("currentPlan")}
          </p>
          <p className="text-xl font-bold">
            {isSupporter ? "Supporter" : t("freePlanName")}
          </p>
        </div>

        {isSupporter ? (
          <>
            <div className="rounded-lg bg-primary/10 p-4">
              <p className="text-sm">
                <span className="font-semibold">{t("thanks.title")}</span>{" "}
                {t("thanks.description")}
              </p>
            </div>
            <Button
              onClick={handleManage}
              variant="outline"
              disabled={loading}
              className="cursor-pointer"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              {t("manage")}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{t("freeInfo")}</p>
            <Button asChild className="cursor-pointer">
              <Link href="/soutien">
                <Heart className="mr-2 h-4 w-4" />
                {t("becomeSupporter")}
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
