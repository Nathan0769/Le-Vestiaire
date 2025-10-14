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

interface LeaderboardPrivacySettingsProps {
  userId: string;
}

export function LeaderboardPrivacySettings({
  userId,
}: LeaderboardPrivacySettingsProps) {
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
          ? "Vous apparaissez maintenant anonymement dans les classements"
          : "Votre profil est maintenant visible dans les classements"
      );
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de mettre à jour vos paramètres");
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
          Confidentialité du classement
        </CardTitle>
        <CardDescription>
          Gérez votre visibilité dans les classements publics
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : (
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="anonymous-mode" className="text-base">
                Apparaître anonymement
              </Label>
              <p className="text-sm text-muted-foreground">
                Votre nom, avatar et équipe favorite seront masqués. Vous
                apparaîtrez comme &quot;Collectionneur #XXXX&quot;
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
              ℹ️ Vous apparaissez actuellement comme{" "}
              <span className="font-semibold">anonyme</span> dans tous les
              classements publics.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
