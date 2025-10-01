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
import { Heart, Share } from "lucide-react";
import Image from "next/image";
import type { Theme } from "@/types/theme";
import type {
  ShareableWishlistItem,
  ShareSelection,
} from "@/types/wishlist-share";
import { THEME_LIST } from "@/lib/theme";

interface WishlistSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistItems: ShareableWishlistItem[];
  onNext: (selection: ShareSelection) => void;
}

export function WishlistSelectionModal({
  isOpen,
  onClose,
  wishlistItems,
  onNext,
}: WishlistSelectionModalProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    new Set(wishlistItems.map((item) => item.id))
  );
  const [title, setTitle] = useState("Ma liste de Noël 🎄");
  const [message, setMessage] = useState(
    "Salut ! Voici quelques idées de maillots qui me feraient plaisir 😊"
  );
  const [selectedTheme, setSelectedTheme] = useState<Theme>("christmas");

  const themes = THEME_LIST;

  const handleThemeChange = (themeId: Theme) => {
    setSelectedTheme(themeId);
    const theme = themes.find((t) => t.id === themeId);
    if (theme) {
      setTitle(theme.defaultTitle);
      setMessage(theme.defaultMessage);
    }
  };

  const handleItemToggle = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedItems(new Set(wishlistItems.map((item) => item.id)));
  };

  const handleSelectNone = () => {
    setSelectedItems(new Set());
  };

  const handleNext = () => {
    const selected = wishlistItems.filter((item) => selectedItems.has(item.id));
    onNext({
      selectedItems: selected,
      title: title.trim(),
      message: message.trim(),
      theme: selectedTheme,
    });
  };

  const getJerseyTypeLabel = (type: string) => {
    const typeLabels = {
      HOME: "Domicile",
      AWAY: "Extérieur",
      THIRD: "Third",
      FOURTH: "Fourth",
      GOALKEEPER: "Gardien",
      SPECIAL: "Spécial",
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  const selectedCount = selectedItems.size;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 w-[calc(100%-2rem)] sm:w-full">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Partager ma wishlist
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Choisis un thème</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleThemeChange(theme.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
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
                  rows={2}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {message.length}/500 caractères
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">
                  Sélectionnez vos maillots ({selectedCount}/
                  {wishlistItems.length})
                </h3>

                <div className="hidden sm:flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={selectedCount === wishlistItems.length}
                    type="button"
                  >
                    Tout sélectionner
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectNone}
                    disabled={selectedCount === 0}
                    type="button"
                  >
                    Tout déselectionner
                  </Button>
                </div>

                <div className="sm:hidden">
                  {selectedCount === wishlistItems.length ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectNone}
                      type="button"
                    >
                      Tout déselectionner
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      type="button"
                    >
                      Tout sélectionner
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                {wishlistItems.map((item) => {
                  const isSelected = selectedItems.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "bg-card border-border hover:bg-muted/50"
                      }`}
                      onClick={() => handleItemToggle(item.id)}
                    >
                      <div className="relative w-12 h-12 flex-shrink-0 bg-white rounded-md border overflow-hidden">
                        <Image
                          src={item.jersey.imageUrl}
                          alt={item.jersey.name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {item.jersey.club.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground truncate">
                            {getJerseyTypeLabel(item.jersey.type)}{" "}
                            {item.jersey.season}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
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
            disabled={selectedCount === 0}
            className="flex items-center gap-2 cursor-pointer"
            type="button"
          >
            <Share className="w-4 h-4" />
            Partager ({selectedCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
