"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function SessionSettings() {
  const t = useTranslations("Settings.sessionSettings");
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t("signOutSuccess"));
    } catch {
      toast.error(t("signOutError"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogOut className="w-5 h-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{t("signOutLabel")}</p>
            <p className="text-sm text-muted-foreground">
              {t("signOutDescription")}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t("signOutButton")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
