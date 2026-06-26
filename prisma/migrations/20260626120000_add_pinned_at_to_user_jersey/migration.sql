-- AlterTable
ALTER TABLE "user_jerseys" ADD COLUMN "pinnedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "user_jerseys_userId_pinnedAt_idx" ON "user_jerseys"("userId", "pinnedAt");
