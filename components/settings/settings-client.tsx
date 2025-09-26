"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AccountInfo } from "./account-info";
import { EmailSettings } from "./email-settings";
import { PasswordSettings } from "./password-settings";
import { SessionSettings } from "./session-settings";

export function SettingsClient() {
  const currentUser = useCurrentUser();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">Paramètres du compte</h1>
      </div>

      <div className="grid gap-6">
        <AccountInfo user={currentUser} />

        <EmailSettings
          isGoogleOnly={currentUser.authProvider?.isGoogleOnly ?? false}
        />

        <PasswordSettings
          hasPassword={currentUser.authProvider?.hasPassword ?? true}
          isGoogleOnly={currentUser.authProvider?.isGoogleOnly ?? false}
        />
        <Separator />
        <SessionSettings />
        <div className="text-muted-foreground text-center text-xs">
          En utilisant votre compte, vous acceptez nos{" "}
          <a href="/conditions-utilisation" className="underline">
            Conditions d&apos;utilisation
          </a>{" "}
          et{" "}
          <a href="/politique-confidentialite" className="underline">
            Politique de confidentialité
          </a>
          .
        </div>
      </div>
    </div>
  );
}
