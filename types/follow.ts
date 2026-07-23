export type FollowState = "none" | "following" | "requested";

export interface PublicUser {
  id: string;
  username: string;
  name: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  image?: string | null;
  bio?: string | null;
  isPrivate?: boolean;
  favoriteClub?: {
    id: string;
    name: string;
  };
}

export interface FollowRequestItem {
  id: string;
  requester: PublicUser;
  createdAt: string;
}

export interface SearchUserResult extends PublicUser {
  followState: FollowState;
}
