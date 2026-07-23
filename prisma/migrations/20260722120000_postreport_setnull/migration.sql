-- Passe les FK de PostReport en SetNull pour préserver l'audit trail
-- même quand le post/comment ciblé est supprimé.

ALTER TABLE "post_reports" DROP CONSTRAINT "post_reports_post_id_fkey";
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_post_id_fkey"
  FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "post_reports" DROP CONSTRAINT "post_reports_comment_id_fkey";
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_comment_id_fkey"
  FOREIGN KEY ("comment_id") REFERENCES "post_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
