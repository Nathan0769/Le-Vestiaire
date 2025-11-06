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
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Wishlist.themeModal");
  const tTheme = useTranslations("Wishlist.themeModal.themes");
  const [selectedTheme, setSelectedTheme] = useState<Theme>("christmas");
  const [title, setTitle] = useState(tTheme("christmas.defaultTitle"));
  const [message, setMessage] = useState(tTheme("christmas.defaultMessage"));

  const themes = THEME_LIST;

  const handleThemeChange = (themeId: Theme) => {
    setSelectedTheme(themeId);
    setTitle(tTheme(`${themeId}.defaultTitle`));
    setMessage(tTheme(`${themeId}.defaultMessage`));
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
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <Badge variant="secondary">
              {t("selectedCount", { count: wishlistItems.length })}
            </Badge>
          </div>

          <div className="space-y-3">
            <Label>{t("chooseTheme")}</Label>
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
                  <div className="text-xs font-medium">
                    {tTheme(`${theme.id}.name`)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t("listTitle")}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("listTitlePlaceholder")}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t("personalMessage")}</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("personalMessagePlaceholder")}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {t("charactersCount", { count: message.length })}
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
            {t("cancel")}
          </Button>
          <Button
            onClick={handleNext}
            className="flex items-center gap-2 cursor-pointer"
            type="button"
          >
            <Share className="w-4 h-4" />
            {t("continue")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
