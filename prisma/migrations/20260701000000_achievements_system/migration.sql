-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('COLLECTION', 'DIVERSITY', 'SOCIAL', 'LEADERBOARD', 'LOYALTY', 'RARITY', 'CONTRIBUTION');

-- DropForeignKey
ALTER TABLE "achievements" DROP CONSTRAINT "fk_user";

-- DropConstraint (was UNIQUE CONSTRAINT, not just an index)
ALTER TABLE "achievements" DROP CONSTRAINT "unique_monthly_badge";

-- AlterTable
ALTER TABLE "achievements" DROP COLUMN "badge_month",
DROP COLUMN "badge_type",
DROP COLUMN "created_at",
DROP COLUMN "earned_at",
DROP COLUMN "rank",
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "tier" TEXT,
ADD COLUMN     "unlocked_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "category",
ADD COLUMN     "category" "AchievementCategory" NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "last_achievements_seen_at" TIMESTAMP(6);

-- CreateIndex
CREATE INDEX "achievements_user_id_unlocked_at_idx" ON "achievements"("user_id", "unlocked_at");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_user_id_key_key" ON "achievements"("user_id", "key");

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

