export type FriendshipStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";

export interface Friendship {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FriendUser {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface FriendWithUser extends Friendship {
  user: FriendUser;
}

export interface FriendshipRequest {
  id: string;
  sender: FriendUser;
  status: FriendshipStatus;
  createdAt: string;
}

export interface SearchUserResult {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  avatarUrl?: string;
  bio?: string;
  friendshipStatus?: FriendshipStatus | null;
}

export interface SearchUsersResponse {
  users: SearchUserResult[];
}
