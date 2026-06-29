-- CreateEnum
CREATE TYPE "JerseyVersion" AS ENUM ('REPLICA', 'AUTHENTIC', 'STOCK_PRO', 'PLAYER_ISSUE', 'MATCH_WORN');

-- AlterTable
ALTER TABLE "user_jerseys"
  ADD COLUMN "version" "JerseyVersion" NOT NULL DEFAULT 'REPLICA',
  ADD COLUMN "isSigned" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "signedBy" TEXT,
  ADD COLUMN "hasAuthCertificate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "matchDescription" TEXT,
  ADD COLUMN "matchDate" TIMESTAMP(3);

-- DropIndex
ALTER TABLE "user_jerseys" DROP CONSTRAINT IF EXISTS "user_jerseys_userId_jerseyId_key";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_jerseys_userId_idx" ON "user_jerseys"("userId");
CREATE INDEX IF NOT EXISTS "user_jerseys_jerseyId_idx" ON "user_jerseys"("jerseyId");
