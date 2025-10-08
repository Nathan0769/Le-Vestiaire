"use client";

import { Button } from "@/components/ui/button";
import { Camera, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ScanPlaceholderProps {
  brand: string;
}

export function ScanPlaceholder({ brand }: ScanPlaceholderProps) {
  return (
    <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Scanner l&apos;étiquette
        </CardTitle>
        <CardDescription>
          Vérification automatique par intelligence artificielle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
          <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Fonctionnalité bientôt disponible !
            </p>
            <p className="text-sm text-muted-foreground">
              Nous travaillons sur l&apos;intégration de{" "}
              <span className="font-semibold text-foreground">KitLegit</span>,
              une solution d&apos;authentification par IA spécialisée dans les
              maillots de football.
            </p>
            <p className="text-sm text-muted-foreground">
              En attendant, utilisez le guide ci-dessus pour vérifier
              manuellement l&apos;authenticité de votre maillot {brand}.
            </p>
          </div>
        </div>

        <Button disabled className="w-full" size="lg">
          <Camera className="w-4 h-4 mr-2" />
          Scanner mon étiquette (Bientôt disponible)
        </Button>

        <div className="text-xs text-center text-muted-foreground">
          Le scan automatique nécessitera 3 à 8 photos de votre maillot pour une
          analyse complète.
        </div>
      </CardContent>
    </Card>
  );
}
