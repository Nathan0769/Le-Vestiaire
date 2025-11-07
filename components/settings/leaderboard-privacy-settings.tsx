"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface LeaderboardPrivacySettingsProps {
  userId: string;
}

export function LeaderboardPrivacySettings({
  userId,
}: LeaderboardPrivacySettingsProps) {
  const t = useTranslations("Settings.leaderboardPrivacy");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(
          `/api/user/leaderboard-settings?userId=${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          setIsAnonymous(data.leaderboardAnonymous ?? true);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des paramètres:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [userId]);

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/leaderboard-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leaderboardAnonymous: checked,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }

      setIsAnonymous(checked);
      toast.success(
        checked
          ? t("anonymousSuccess")
          : t("visibleSuccess")
      );
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(t("updateError"));
      setIsAnonymous(!checked);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          {t("title")}
        </CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <p className="text-muted-foreground">{t("loading")}</p>
          </div>
        ) : (
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="anonymous-mode" className="text-base">
                {t("anonymousLabel")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("anonymousDescription")}
              </p>
            </div>
            <Switch
              id="anonymous-mode"
              className="cursor-pointer"
              checked={isAnonymous}
              onCheckedChange={handleToggle}
              disabled={isLoading}
            />
          </div>
        )}

        {isAnonymous && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              ℹ️ {t("currentlyAnonymous")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
