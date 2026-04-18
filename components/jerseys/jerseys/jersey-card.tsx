"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { JerseyType } from "@prisma/client";
import { Club } from "@prisma/client";
import { getJerseyUrl } from "@/lib/jersey-url";
import { useTranslations, useLocale } from "next-intl";
import { translateJerseyName } from "@/lib/translate-jersey-name";
import { Trash2 } from "lucide-react";
import { useState } from "react";

type Props = {
  jersey: {
    id: string;
    name: string;
    imageUrl: string;
    type: JerseyType;
    slug?: string | null;
    season?: string;
  };
  leagueId: string;
  club: Club;
  showFullInfo?: boolean;
  isAdmin?: boolean;
};

export function JerseyCard({
  jersey,
  leagueId,
  club,
  showFullInfo,
  isAdmin,
}: Props) {
  const router = useRouter();
  const locale = useLocale();
  const tJerseyType = useTranslations("JerseyType");
  const [isDeleting, setIsDeleting] = useState(false);

  const translatedJerseyName = translateJerseyName({
    jersey: {
      name: jersey.name,
      type: jersey.type as JerseyType,
      season: jersey.season || "",
      clubShortName: club.shortName,
    },
    locale,
    typeTranslation: tJerseyType(jersey.type),
  });

  const handleClick = () => {
    const identifier = jersey.slug || jersey.id;
    const url = getJerseyUrl(leagueId, club.id, identifier);
    router.push(url);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/jerseys/${jersey.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative group cursor-pointer">
      {isAdmin && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-white border border-destructive/30 text-destructive shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white hover:border-destructive cursor-pointer"
              disabled={isDeleting}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce maillot ?</AlertDialogTitle>
              <AlertDialogDescription>
                {translatedJerseyName} ({jersey.season}) sera supprimé
                définitivement, ainsi que toutes les collections, wishlists et
                notes associées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Card
        onClick={handleClick}
        className="cursor-pointer transition-all hover:shadow-lg"
      >
        <CardContent className="flex flex-col items-center justify-center p-4">
          <div className="relative w-24 h-24 mb-2">
            <Image
              src={jersey.imageUrl}
              alt={translatedJerseyName}
              fill
              className="object-contain"
            />
          </div>
          {showFullInfo ? (
            <div className="space-y-1 w-full">
              <p className="text-sm font-medium text-center line-clamp-2">
                {club.name}
              </p>
              <p className="text-xs text-muted-foreground text-center">
                {tJerseyType(
                  jersey.type as
                    | "HOME"
                    | "AWAY"
                    | "THIRD"
                    | "FOURTH"
                    | "GOALKEEPER"
                    | "SPECIAL"
                )}{" "}
                • {jersey.season}
              </p>
            </div>
          ) : (
            <p className="text-sm font-medium text-center">
              {tJerseyType(
                jersey.type as
                  | "HOME"
                  | "AWAY"
                  | "THIRD"
                  | "FOURTH"
                  | "GOALKEEPER"
                  | "SPECIAL"
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
