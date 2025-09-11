"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface EmailSettingsProps {
  isGoogleOnly: boolean;
}

export function EmailSettings({ isGoogleOnly }: EmailSettingsProps) {
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const handleChangeEmail = async () => {
    if (!newEmail.includes("@")) {
      toast.error("Adresse email invalide");
      return;
    }

    setIsChangingEmail(true);
    try {
      const { error } = await authClient.updateUser({
        email: newEmail,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(
        "Demande de changement d'email envoyée. Vérifiez votre boîte mail."
      );
      setNewEmail("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors du changement d'email"
      );
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Changer d&apos;adresse email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isGoogleOnly ? (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              🔗 Votre compte est connecté via Google. Pour changer votre
              adresse email, vous devez le faire directement dans votre compte
              Google.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="new-email">Nouvelle adresse email</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nouvelle@email.com"
              />
            </div>

            <Button
              onClick={handleChangeEmail}
              disabled={isChangingEmail || !newEmail}
              className="cursor-pointer"
            >
              {isChangingEmail ? "Changement..." : "Changer l'email"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
