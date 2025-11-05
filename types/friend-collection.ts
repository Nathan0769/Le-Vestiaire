export interface FriendBasicInfo {
  friendshipId: string;
  userId: string;
  username: string;
  name: string;
  avatar: string | null;
  avatarUrl: string | null;
  bio: string | null;
  favoriteClub: {
    id: string;
    name: string;
  } | null;
}

export interface FriendCollectionItem {
  id: string;
  jerseyId: string;
  size: string | null;
  condition: string;
  hasTags: boolean;
  personalization: string | null;
  purchasePrice: number | null;
  purchaseDate: Date | null;
  isGift: boolean;
  isFromMysteryBox: boolean;
  userPhotoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  jersey: {
    id: string;
    name: string;
    imageUrl: string;
    type: string;
    season: string;
    brand: string;
    retailPrice: number | null;
    club: {
      id: string;
      name: string;
      shortName: string;
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
}

export interface FriendCollectionStats {
  total: number;
  totalValue: number | null;
  leagueStats: Record<string, number>;
  conditionStats: Record<string, number>;
  typeStats: Record<string, number>;
  provenanceStats: {
    regular: number;
    gifts: number;
    mysteryBox: number;
  };
}

export interface FriendCollectionResponse {
  user: {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
    avatarUrl: string | null;
    bio: string | null;
    favoriteClub: {
      id: string;
      name: string;
    } | null;
  };
  collection: FriendCollectionItem[];
  stats: FriendCollectionStats;
}

export interface FriendsListResponse {
  friends: FriendBasicInfo[];
}
