-- Ajoute des FK avec ON DELETE CASCADE pour Notification.postId et .commentId.
-- Avant : String? sans FK, donc les notifs devenaient orphelines quand un
-- post/comment était hard-deleted (ex : dedup posts, delete manuel).

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_post_id_fkey"
  FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_comment_id_fkey"
  FOREIGN KEY ("comment_id") REFERENCES "post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
