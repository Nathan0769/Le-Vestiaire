import type { PostType, CapKind, Condition, Size, JerseyVersion } from "@prisma/client";

export interface FeedAuthor {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  favoriteClubColor: string | null;
  favoriteClubName: string | null;
}

export interface FeedLikerPreview {
  userId: string;
  name: string;
  avatarUrl: string | null;
}

export interface JerseyAddPayload {
  userJerseyId: string;
  jersey: {
    id: string;
    name: string;
    season: string;
    type: string;
    imageUrl: string;
    slug: string | null;
    mainColor: string | null;
    club: {
      id: string;
      name: string;
      shortName: string;
      logoUrl: string;
      primaryColor: string;
    };
  };
  customPhotoUrl: string | null;
  condition: Condition;
  size: Size | null;
  version: JerseyVersion;
  playerName: string | null;
  playerNumber: number | null;
  purchasePrice: number | null;
  authorRating: number | null;
  clubRank: number | null;
  patchesCount: number;
}

export interface AchievementUnlockPayload {
  key: string;
  tier: string | null;
  category: string;
  unlockedAt: string;
  metadata: Record<string, unknown> | null;
}

export interface CapReachedPayload {
  capKind: CapKind;
  mosaic: { imageUrl: string | null }[];
}

export type FeedPostPayload =
  | JerseyAddPayload
  | AchievementUnlockPayload
  | CapReachedPayload
  | null;

export interface FeedPostItem {
  id: string;
  type: PostType;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  hasLiked: boolean;
  isFollowingAuthor: boolean;
  likersPreview: FeedLikerPreview[];
  author: FeedAuthor | null;
  payload: FeedPostPayload;
}

export interface FeedPage {
  items: FeedPostItem[];
  nextCursor: string | null;
}
