"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { JerseysBySeason } from "@/components/jerseys/jerseys/jerseys-by-season";
import { SimpleJersey, ClubWithLeague } from "@/types/jersey";

type Props = {
  jerseys: (SimpleJersey & { slug?: string | null })[];
  primaryColor: string;
  club: ClubWithLeague;
  isAdmin: boolean;
};

export function ClubDetailClient({ jerseys, primaryColor, club, isAdmin }: Props) {
  const [deleteMode, setDeleteMode] = useState(false);

  const handleNameClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isAdmin) return;
      if (e.shiftKey) {
        e.preventDefault();
        setDeleteMode((prev) => !prev);
      }
    },
    [isAdmin]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 shrink-0">
          <Image
            src={club.logoUrl}
            alt={`Logo ${club.name}`}
            fill
            className="object-contain"
          />
        </div>
        <div className="flex items-center gap-3">
          <h1
            className={`text-2xl font-semibold select-none ${
              isAdmin ? "cursor-pointer" : ""
            } ${deleteMode ? "text-destructive" : ""}`}
            onClick={handleNameClick}
            title={isAdmin ? "Maj + clic pour activer le mode suppression" : undefined}
          >
            {club.name}
          </h1>
          {deleteMode && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
              Mode suppression
            </span>
          )}
        </div>
      </div>

      <JerseysBySeason
        jerseys={jerseys}
        primaryColor={primaryColor}
        club={club}
        isAdmin={deleteMode}
      />
    </div>
  );
}
