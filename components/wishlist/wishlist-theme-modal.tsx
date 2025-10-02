"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, Share } from "lucide-react";
import type { Theme } from "@/types/theme";
import type { ShareableWishlistItem } from "@/types/wishlist-share";
import { THEME_LIST } from "@/lib/theme";

interface WishlistThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistItems: ShareableWishlistItem[];
  onNext: (selection: {
    selectedItems: ShareableWishlistItem[];
    title: string;
    message: string;
    theme: Theme;
  }) => void;
}

export function WishlistThemeModal({
  isOpen,
  onClose,
  wishlistItems,
  onNext,
}: WishlistThemeModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<Theme>("christmas");
  const [title, setTitle] = useState("Ma liste de Noël 🎄");
  const [message, setMessage] = useState(
    "Salut ! Voici quelques idées de maillots qui me feraient plaisir 😊"
  );

  const themes = THEME_LIST;

  const handleThemeChange = (themeId: Theme) => {
    setSelectedTheme(themeId);
    const theme = themes.find((t) => t.id === themeId);
    if (theme) {
      setTitle(theme.defaultTitle);
      setMessage(theme.defaultMessage);
    }
  };

  const handleNext = () => {
    onNext({
      selectedItems: wishlistItems,
      title: title.trim(),
      message: message.trim(),
      theme: selectedTheme,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[calc(100%-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Personnaliser ma wishlist
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <Badge variant="secondary">
              {wishlistItems.length} maillot
              {wishlistItems.length > 1 ? "s" : ""} sélectionné
              {wishlistItems.length > 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="space-y-3">
            <Label>Choisis un thème</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleThemeChange(theme.id)}
                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedTheme === theme.id
                      ? theme.activeColor + " shadow-md"
                      : theme.color + " hover:scale-105"
                  }`}
                >
                  <div className="text-2xl mb-1">{theme.icon}</div>
                  <div className="text-xs font-medium">{theme.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de votre liste</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Ma liste de Noël 🎄"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message personnel</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ajoutez un message pour vos proches..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/500 caractères
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            type="button"
            className="cursor-pointer"
          >
            Annuler
          </Button>
          <Button
            onClick={handleNext}
            className="flex items-center gap-2 cursor-pointer"
            type="button"
          >
            <Share className="w-4 h-4" />
            Continuer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
