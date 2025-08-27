// types/collection.ts

import type {
  Size as PrismaSize,
  Condition as PrismaCondition,
} from "@prisma/client";

export type Size = PrismaSize;
export type Condition = PrismaCondition;

// Labels français pour les enums
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

// Interface pour la collection d'un utilisateur
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

// Interface pour l'ajout à la collection
export interface AddToCollectionData {
  size: Size;
  condition: Condition;
  hasTags?: boolean;
  personalization?: string;
  purchasePrice?: number;
  purchaseDate?: Date;
  notes?: string;
}

// Interface pour la réponse API
export interface CollectionResponse {
  isInCollection: boolean;
  userJersey?: UserJersey;
}
