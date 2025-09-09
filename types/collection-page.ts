// types/collection-page.ts

export type CollectionItemWithJersey = {
  id: string;
  userId: string;
  jerseyId: string;
  size?: string | null;
  condition: string;
  hasTags: boolean;
  personalization?: string | null;
  purchasePrice?: number | null; // Converti de Decimal à number
  purchaseDate?: Date | null;
  notes?: string | null;
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
    retailPrice?: number | null; // Converti de Decimal à number
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
