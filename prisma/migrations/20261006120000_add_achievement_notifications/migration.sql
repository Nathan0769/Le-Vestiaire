-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ACHIEVEMENT_UNLOCKED';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "achievement_key" TEXT;
