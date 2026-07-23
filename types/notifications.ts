import type { NotificationType } from "@prisma/client";

/**
 * Type virtuel injecté par /api/notifications à partir des FollowRequest pending.
 * N'existe pas dans l'enum Prisma (évite une migration DB).
 */
export type VirtualNotificationType = "FOLLOW_REQUEST_RECEIVED";

export type FeedNotificationType = NotificationType | VirtualNotificationType;

export interface NotificationActor {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}

export interface NotificationItem {
  id: string;
  type: FeedNotificationType;
  createdAt: string;
  readAt: string | null;
  postId: string | null;
  commentId: string | null;
  followRequestId?: string;
  actor: NotificationActor | null;
}

export interface NotificationsPage {
  items: NotificationItem[];
  nextCursor: string | null;
}
