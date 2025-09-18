import type {
  Size as PrismaSize,
  Condition as PrismaCondition,
} from "@prisma/client";

export type Size = PrismaSize;
export type Condition = PrismaCondition;

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

export interface UserJersey {
  id: string;
  userId: string;
  jerseyId: string;
  size?: Size;
  condition: Condition;
  hasTags: boolean;
  personalization?: string;
  purchasePrice?: number;
  purchaseDate?: Date;
  notes?: string;
  userPhotoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToCollectionData {
  size: Size;
  condition: Condition;
  hasTags?: boolean;
  personalization?: string;
  purchasePrice?: number;
  purchaseDate?: Date;
  notes?: string;
}

export interface UpdateCollectionData {
  size: Size;
  condition: Condition;
  hasTags?: boolean;
  personalization?: string;
  purchasePrice?: number;
  purchaseDate?: Date;
  notes?: string;
}

export interface CollectionResponse {
  isInCollection: boolean;
  userJersey?: UserJersey;
}

export interface UpdateCollectionResponse {
  success: boolean;
  message: string;
  userJersey?: import("@/types/collection-page").CollectionItemWithJersey;
}

export interface CollectionError {
  error: string;
}
