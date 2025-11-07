"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface EmailSettingsProps {
  isGoogleOnly: boolean;
}

export function EmailSettings({ isGoogleOnly }: EmailSettingsProps) {
  const t = useTranslations("Settings.emailSettings");
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const handleChangeEmail = async () => {
    if (!newEmail.includes("@")) {
      toast.error(t("invalidEmail"));
      return;
    }

    setIsChangingEmail(true);
    try {
      const { error } = await authClient.changeEmail({
        newEmail,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(t("changeSuccess"));
      setNewEmail("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("changeError")
      );
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isGoogleOnly ? (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              🔗 {t("googleOnlyMessage")}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="new-email">{t("newEmailLabel")}</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
              />
            </div>

            <Button
              onClick={handleChangeEmail}
              disabled={isChangingEmail || !newEmail}
              className="cursor-pointer"
            >
              {isChangingEmail ? t("changing") : t("changeButton")}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
