import type {
  Size as PrismaSize,
  Condition as PrismaCondition,
  JerseyVersion as PrismaJerseyVersion,
} from "@prisma/client";
import type { UserJerseyPatchInput } from "@/types/patch";

export type Size = PrismaSize;
export type Condition = PrismaCondition;
export type JerseyVersion = PrismaJerseyVersion;

export const SIZE_LABELS: Record<Size, string> = {
  XS: "XS",
  S: "S",
  M: "M",
  L: "L",
  XL: "XL",
  XXL: "XXL",
};

export const CONDITION_LABELS: Record<Condition, string> = {
  MINT: "Neuf",
  EXCELLENT: "Excellent",
  GOOD: "Bon",
  FAIR: "Correct",
  POOR: "Abîmé",
};

export const JERSEY_VERSION_LABELS: Record<JerseyVersion, string> = {
  REPLICA: "Standard",
  AUTHENTIC: "Boutique - version Joueur",
  STOCK_PRO: "Stock Pro",
  PLAYER_ISSUE: "Préparé / Player Issue",
  MATCH_WORN: "Porté en Match",
};

export interface UserJersey {
  id: string;
  userId: string;
  jerseyId: string;
  version: JerseyVersion;
  size?: Size;
  condition: Condition;
  hasTags: boolean;
  playerName?: string;
  playerNumber?: number;
  purchasePrice?: number;
  purchaseDate?: Date;
  notes?: string;
  isGift: boolean;
  isFromMysteryBox: boolean;
  userPhotoUrl?: string;
  isSigned: boolean;
  signedBy?: string;
  hasAuthCertificate: boolean;
  certificateUrl?: string;
  matchDescription?: string;
  matchDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToCollectionData {
  version?: JerseyVersion;
  size: Size;
  condition: Condition;
  hasTags?: boolean;
  playerName?: string;
  playerNumber?: number;
  purchasePrice?: number;
  purchaseDate?: Date;
  notes?: string;
  isGift: boolean;
  isFromMysteryBox: boolean;
  userPhotoUrl?: string;
  isSigned?: boolean;
  signedBy?: string;
  hasAuthCertificate?: boolean;
  certificateUrl?: string;
  matchDescription?: string;
  matchDate?: Date;
  hasLongSleeves?: boolean;
  patches?: UserJerseyPatchInput[];
}

export interface UpdateCollectionData {
  version?: JerseyVersion;
  size: Size;
  condition: Condition;
  hasTags?: boolean;
  playerName?: string;
  playerNumber?: number;
  purchasePrice?: number;
  purchaseDate?: Date;
  notes?: string;
  isGift: boolean;
  isFromMysteryBox: boolean;
  userPhotoUrl?: string;
  isSigned?: boolean;
  signedBy?: string;
  hasAuthCertificate?: boolean;
  certificateUrl?: string;
  matchDescription?: string;
  matchDate?: Date;
  hasLongSleeves?: boolean;
  patches?: UserJerseyPatchInput[];
}

export interface CollectionResponse {
  isInCollection: boolean;
  count: number;
  userJerseys: UserJersey[];
}

export interface UpdateCollectionResponse {
  success: boolean;
  message: string;
  userJersey?: import("@/types/collection-page").CollectionItemWithJersey;
}

export interface CollectionError {
  error: string;
}
