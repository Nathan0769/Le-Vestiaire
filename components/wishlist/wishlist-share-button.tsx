"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Heart, List, ChevronDown } from "lucide-react";
import { WishlistSelectionModal } from "./wishlist-selection-modal";
import { WishlistThemeModal } from "./wishlist-theme-modal";
import { ShareFormatModal } from "./share-format-modal";

import type { Theme } from "@/types/theme";
import type {
  ShareableWishlistItem,
  ShareSelection,
} from "@/types/wishlist-share";

interface WishlistShareButtonProps {
  wishlistItems: ShareableWishlistItem[];
}

export function WishlistShareButton({
  wishlistItems,
}: WishlistShareButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);

  const [selectedItems, setSelectedItems] = useState<ShareableWishlistItem[]>(
    []
  );
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState<Theme>("christmas");

  const handleShareAll = () => {
    setIsDropdownOpen(false);
    setShowThemeModal(true);
  };

  const handleShareSelection = () => {
    setShowSelectionModal(true);
    setIsDropdownOpen(false);
  };

  const handleThemeNext = (selection: ShareSelection) => {
    setSelectedItems(selection.selectedItems);
    setTitle(selection.title);
    setMessage(selection.message);
    setTheme(selection.theme);
    setShowThemeModal(false);
    setShowFormatModal(true);
  };

  const handleSelectionNext = (selection: ShareSelection) => {
    setSelectedItems(selection.selectedItems);
    setTitle(selection.title);
    setMessage(selection.message);
    setTheme(selection.theme);
    setShowSelectionModal(false);
    setShowFormatModal(true);
  };

  const handleCloseModals = () => {
    setShowSelectionModal(false);
    setShowThemeModal(false);
    setShowFormatModal(false);
    setSelectedItems([]);
    setTitle("");
    setMessage("");
    setTheme("christmas");
  };

  if (wishlistItems.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Partager</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={handleShareAll}
            className="flex items-center gap-3 py-3 cursor-pointer"
          >
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">Toute ma wishlist</span>
              <span className="text-sm text-muted-foreground">
                {wishlistItems.length} maillot
                {wishlistItems.length > 1 ? "s" : ""}
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleShareSelection}
            className="flex items-center gap-3 py-3 cursor-pointer"
          >
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <List className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">Une sélection</span>
              <span className="text-sm text-muted-foreground">
                Choisir les maillots à partager
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <WishlistThemeModal
        isOpen={showThemeModal}
        onClose={handleCloseModals}
        wishlistItems={wishlistItems}
        onNext={handleThemeNext}
      />

      <WishlistSelectionModal
        isOpen={showSelectionModal}
        onClose={handleCloseModals}
        wishlistItems={wishlistItems}
        onNext={handleSelectionNext}
      />

      <ShareFormatModal
        isOpen={showFormatModal}
        onClose={handleCloseModals}
        selectedItems={selectedItems}
        title={title}
        message={message}
        theme={theme}
      />
    </>
  );
}
