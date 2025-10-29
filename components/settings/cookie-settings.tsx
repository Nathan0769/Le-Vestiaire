"use client";

import { Cookie } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clearConsent } from "@/lib/cookie-consent";
import { Link } from "@/i18n/routing";

export function CookieSettings() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Cookie className="h-5 w-5 text-primary" />
          <CardTitle>Gestion des cookies</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Gérez vos préférences concernant l&apos;utilisation des cookies sur Le
          Vestiaire. Vous pouvez modifier vos choix à tout moment.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={clearConsent}
            variant="outline"
            className="w-full sm:w-auto cursor-pointer"
          >
            Modifier mes préférences
          </Button>
          <p className="text-xs text-muted-foreground">
            Cliquez pour rouvrir la bannière de consentement et modifier vos
            choix.
          </p>
        </div>
        <div className="pt-2 border-t">
          <Link
            href="/politique-cookies"
            className="text-sm text-primary hover:underline"
          >
            Voir la politique de cookies complète
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
