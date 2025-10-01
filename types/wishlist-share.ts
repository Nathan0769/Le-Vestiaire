import type { Theme } from "@/types/theme";

export interface WishlistJersey {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  season: string;
  club: {
    name: string;
  };
}

export interface ShareableWishlistItem {
  id: string;
  jersey: WishlistJersey;
}

export interface ShareSelection {
  selectedItems: ShareableWishlistItem[];
  title: string;
  message: string;
  theme: Theme;
}

export interface ShareData {
  title: string;
  message?: string;
  theme: Theme;
  jerseys: ShareableWishlistItem[];
}
