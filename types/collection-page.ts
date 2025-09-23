export type CollectionItemWithJersey = {
  id: string;
  userId: string;
  jerseyId: string;
  size?: string | null;
  condition: string;
  hasTags: boolean;
  personalization?: string | null;
  purchasePrice?: number | null;
  purchaseDate?: Date | null;
  notes?: string | null;
  isGift: boolean;
  isFromMysteryBox: boolean;
  userPhotoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  jersey: {
    id: string;
    name: string;
    imageUrl: string;
    type: string;
    season: string;
    brand: string;
    retailPrice?: number | null;
    description?: string | null;
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
