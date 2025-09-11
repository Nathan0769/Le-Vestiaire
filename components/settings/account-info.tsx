"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { CurrentUser } from "@/hooks/useCurrentUser";

interface AccountInfoProps {
  user: CurrentUser;
}

export function AccountInfo({ user }: AccountInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Informations du compte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nom d&apos;utilisateur</Label>
            <Input value={user.name || ""} disabled />
          </div>

          <div className="space-y-2">
            <Label>Adresse email</Label>
            <div className="flex items-center gap-2">
              <Input value={user.email} disabled />
              {user.authProvider?.hasGoogle && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Google
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Membre depuis</Label>
          <p className="text-sm text-muted-foreground">
            {format(new Date(user.createdAt), "MMMM yyyy", { locale: fr })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
