-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'COMMENT_REPLIED';

-- AlterTable
ALTER TABLE "post_comments" ADD COLUMN     "like_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parent_id" TEXT,
ADD COLUMN     "reply_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "post_comment_likes" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "post_comment_likes_user_id_idx" ON "post_comment_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_comment_likes_comment_id_user_id_key" ON "post_comment_likes"("comment_id", "user_id");

-- CreateIndex
CREATE INDEX "post_comments_parent_id_created_at_idx" ON "post_comments"("parent_id", "created_at");

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comment_likes" ADD CONSTRAINT "post_comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comment_likes" ADD CONSTRAINT "post_comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

