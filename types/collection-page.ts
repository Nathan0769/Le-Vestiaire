import type { PatchFamily } from "@prisma/client";

export type CollectionItemPatch = {
  id: string;
  patchId: string | null;
  customLabel: string | null;
  patch: {
    id: string;
    name: string;
    family: PatchFamily;
    versions: {
      id: string;
      seasonStart: string;
      seasonEnd: string | null;
      imageUrl: string | null;
    }[];
  } | null;
};

export type CollectionItemWithJersey = {
  id: string;
  userId: string;
  jerseyId: string;
  version: string;
  size?: string | null;
  condition: string;
  hasTags: boolean;
  playerName?: string | null;
  playerNumber?: number | null;
  purchasePrice?: number | null;
  purchaseDate?: Date | null;
  notes?: string | null;
  isGift: boolean;
  isFromMysteryBox: boolean;
  userPhotoUrl?: string | null;
  isSigned: boolean;
  signedBy?: string | null;
  hasAuthCertificate: boolean;
  certificateUrl?: string | null;
  matchDescription?: string | null;
  matchDate?: Date | null;
  hasLongSleeves?: boolean;
  patches?: CollectionItemPatch[];
  pinnedAt?: Date | string | null;
  createdAt: Date;
  updatedAt: Date;
  jersey: {
    id: string;
    name: string;
    imageUrl: string;
    type: string;
    variant: number;
    season: string;
    brand: string;
    retailPrice?: number | null;
    description?: string | null;
    mainColor?: string | null;
    club: {
      id: string;
      name: string;
      shortName: string;
      leagueId: string;
      logoUrl: string;
      primaryColor: string;
      league: {
        id: string;
        name: string;
        country: string;
        logoUrl: string;
        tier: number;
      };
    };
  };
};
